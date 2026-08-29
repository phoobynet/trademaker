import { panelRegistry } from '../panelRegistry';
import {
  cloneSerializableRecord,
  type SerializablePanelParameters,
} from '../types';

interface SerializedValidationContext {
  groupIds: Set<string>;
  panelIds: Set<string>;
  referencedPanelIds: Set<string>;
}

export function validateSerializedDockview(
  layout: unknown,
): Readonly<Record<string, unknown>> {
  if (!isPlainRecord(layout)) {
    return invalidSavedLayout('layout must be a plain object');
  }
  if (!isPlainRecord(layout.grid) || !isPlainRecord(layout.panels)) {
    return invalidSavedLayout(
      'layout must contain plain Dockview grid and panel records',
    );
  }

  validatePopoutGroups(layout.popoutGroups);
  if (layout.edgeGroups !== undefined) {
    return invalidSavedLayout('edge groups are not supported');
  }

  const panelIds = new Set(Object.keys(layout.panels));
  const nestedInstanceIds = new Set<string>();
  const safePanels: Record<string, unknown> = {};
  for (const [instanceId, panel] of Object.entries(layout.panels)) {
    safePanels[instanceId] = validateSerializedPanel(
      instanceId,
      panel,
      nestedInstanceIds,
    );
  }

  const context: SerializedValidationContext = {
    groupIds: new Set(),
    panelIds,
    referencedPanelIds: new Set(),
  };
  validateSerializedGrid(layout.grid, context, 'grid');
  validateFloatingGroups(layout.floatingGroups, context);

  for (const panelId of panelIds) {
    if (!context.referencedPanelIds.has(panelId)) {
      return invalidSavedLayout(
        `panel "${panelId}" is not referenced by the grid or a floating group`,
      );
    }
  }

  if (
    layout.activeGroup !== undefined &&
    (typeof layout.activeGroup !== 'string' ||
      !context.groupIds.has(layout.activeGroup))
  ) {
    return invalidSavedLayout('activeGroup must reference a known group id');
  }

  return {
    ...layout,
    panels: safePanels,
  };
}

function validateSerializedPanel(
  instanceId: string,
  panel: unknown,
  nestedInstanceIds: Set<string>,
): Record<string, unknown> {
  const definition = panelRegistry.find(
    (candidate) => `panel-${candidate.type}` === instanceId,
  );
  if (!definition) {
    return invalidSavedLayout(`panel key "${instanceId}" is not registered`);
  }
  if (!isPlainRecord(panel) || !isPlainRecord(panel.params)) {
    return invalidSavedLayout(
      `panel "${instanceId}" must contain plain panel and params records`,
    );
  }
  if (panel.id !== instanceId) {
    return invalidSavedLayout(
      `panel key "${instanceId}" does not match its serialized id`,
    );
  }
  if (panel.view !== undefined) {
    return invalidSavedLayout(
      `panel "${instanceId}" uses an unsupported legacy component view`,
    );
  }
  if (panel.contentComponent !== definition.type) {
    return invalidSavedLayout(
      `panel "${instanceId}" has an unapproved content component`,
    );
  }
  if (panel.tabComponent !== 'workspace-panel-tab') {
    return invalidSavedLayout(
      `panel "${instanceId}" has an unapproved tab component`,
    );
  }
  if (panel.title !== definition.title) {
    return invalidSavedLayout(
      `panel "${instanceId}" title does not match the registry`,
    );
  }

  const params = panel.params;
  if (typeof params.instanceId !== 'string') {
    return invalidSavedLayout(
      `panel "${instanceId}" has no nested instance id`,
    );
  }
  if (nestedInstanceIds.has(params.instanceId)) {
    return invalidSavedLayout(
      `nested panel instance id "${params.instanceId}" is duplicated`,
    );
  }
  nestedInstanceIds.add(params.instanceId);
  if (params.instanceId !== instanceId) {
    return invalidSavedLayout(
      `panel "${instanceId}" does not match its nested instance id`,
    );
  }
  if (params.panelType !== definition.type) {
    return invalidSavedLayout(
      `panel "${instanceId}" type does not match the registry`,
    );
  }
  if (params.title !== definition.title) {
    return invalidSavedLayout(
      `panel "${instanceId}" nested title does not match the registry`,
    );
  }
  if (!isPlainRecord(params.panelParameters)) {
    return invalidSavedLayout(
      `panel "${instanceId}" parameters must be a plain object`,
    );
  }

  let panelParameters: SerializablePanelParameters;
  try {
    panelParameters = cloneSerializableRecord(
      params.panelParameters as SerializablePanelParameters,
    );
  } catch {
    return invalidSavedLayout(
      `panel "${instanceId}" parameters must be JSON-safe`,
    );
  }

  for (const constraint of [
    'minimumHeight',
    'maximumHeight',
    'minimumWidth',
    'maximumWidth',
  ]) {
    const value = panel[constraint];
    if (value !== undefined && !isFiniteNumber(value)) {
      return invalidSavedLayout(
        `panel "${instanceId}" has an invalid ${constraint}`,
      );
    }
  }
  if (panel.pinned !== undefined && typeof panel.pinned !== 'boolean') {
    return invalidSavedLayout(
      `panel "${instanceId}" has an invalid pinned value`,
    );
  }

  return {
    ...panel,
    params: {
      ...params,
      panelParameters,
    },
  };
}

function validateSerializedGrid(
  grid: unknown,
  context: SerializedValidationContext,
  label: string,
): void {
  if (!isPlainRecord(grid)) {
    return invalidSavedLayout(`${label} must be a plain grid object`);
  }
  if (
    !isFiniteNumber(grid.width) ||
    grid.width < 0 ||
    !isFiniteNumber(grid.height) ||
    grid.height < 0
  ) {
    return invalidSavedLayout(`${label} dimensions must be finite`);
  }
  if (grid.orientation !== 'HORIZONTAL' && grid.orientation !== 'VERTICAL') {
    return invalidSavedLayout(`${label} orientation is invalid`);
  }

  validateSerializedGridNode(grid.root, context, `${label}.root`);
  if (grid.maximizedNode !== undefined) {
    validateMaximizedNode(grid.maximizedNode, grid.root, label);
  }
}

function validateSerializedGridNode(
  node: unknown,
  context: SerializedValidationContext,
  label: string,
): void {
  if (!isPlainRecord(node)) {
    return invalidSavedLayout(`${label} must be a plain grid node`);
  }
  if (node.size !== undefined && !isFiniteNumber(node.size)) {
    return invalidSavedLayout(`${label} size must be finite`);
  }
  if (node.visible !== undefined && typeof node.visible !== 'boolean') {
    return invalidSavedLayout(`${label} visible flag must be boolean`);
  }

  if (node.type === 'branch') {
    if (!Array.isArray(node.data)) {
      return invalidSavedLayout(`${label} branch data must be an array`);
    }
    node.data.forEach((child, index) =>
      validateSerializedGridNode(child, context, `${label}.${index}`),
    );
    return;
  }
  if (node.type !== 'leaf') {
    return invalidSavedLayout(`${label} has an invalid node type`);
  }
  validateSerializedGroup(node.data, context, label);
}

function validateSerializedGroup(
  group: unknown,
  context: SerializedValidationContext,
  label: string,
): void {
  if (!isPlainRecord(group) || typeof group.id !== 'string' || !group.id) {
    return invalidSavedLayout(`${label} leaf must have a string group id`);
  }
  if (context.groupIds.has(group.id)) {
    return invalidSavedLayout(`group id "${group.id}" is duplicated`);
  }
  context.groupIds.add(group.id);
  if (!Array.isArray(group.views)) {
    return invalidSavedLayout(`group "${group.id}" views must be an array`);
  }
  if (group.tabGroups !== undefined) {
    return invalidSavedLayout(
      `group "${group.id}" uses unsupported nested tab-group metadata`,
    );
  }

  const groupViews = new Set<string>();
  for (const panelId of group.views) {
    if (typeof panelId !== 'string' || !context.panelIds.has(panelId)) {
      return invalidSavedLayout(
        `group "${group.id}" references an unknown panel`,
      );
    }
    if (groupViews.has(panelId) || context.referencedPanelIds.has(panelId)) {
      return invalidSavedLayout(
        `panel reference "${panelId}" is duplicated`,
      );
    }
    groupViews.add(panelId);
    context.referencedPanelIds.add(panelId);
  }

  if (
    group.activeView !== undefined &&
    (typeof group.activeView !== 'string' ||
      !groupViews.has(group.activeView))
  ) {
    return invalidSavedLayout(
      `group "${group.id}" activeView must reference one of its views`,
    );
  }
}

function validateFloatingGroups(
  floatingGroups: unknown,
  context: SerializedValidationContext,
): void {
  if (floatingGroups === undefined) return;
  if (!Array.isArray(floatingGroups)) {
    return invalidSavedLayout('floatingGroups must be an array');
  }

  floatingGroups.forEach((floatingGroup, index) => {
    if (!isPlainRecord(floatingGroup)) {
      return invalidSavedLayout(`floatingGroups.${index} must be an object`);
    }
    const hasData = floatingGroup.data !== undefined;
    const hasGrid = floatingGroup.grid !== undefined;
    if (hasData === hasGrid) {
      return invalidSavedLayout(
        `floatingGroups.${index} must contain exactly one of data or grid`,
      );
    }
    validateAnchoredBox(floatingGroup.position, index);
    if (hasData) {
      validateSerializedGroup(
        floatingGroup.data,
        context,
        `floatingGroups.${index}`,
      );
    } else {
      validateSerializedGrid(
        floatingGroup.grid,
        context,
        `floatingGroups.${index}.grid`,
      );
    }
  });
}

function validateAnchoredBox(position: unknown, index: number): void {
  if (!isPlainRecord(position)) {
    return invalidSavedLayout(
      `floatingGroups.${index} position must be an object`,
    );
  }
  if (
    !isFiniteNumber(position.width) ||
    position.width <= 0 ||
    !isFiniteNumber(position.height) ||
    position.height <= 0
  ) {
    return invalidSavedLayout(
      `floatingGroups.${index} position must have positive dimensions`,
    );
  }
  const verticalAnchors = [position.top, position.bottom].filter(
    (value) => value !== undefined,
  );
  const horizontalAnchors = [position.left, position.right].filter(
    (value) => value !== undefined,
  );
  if (
    verticalAnchors.length !== 1 ||
    horizontalAnchors.length !== 1 ||
    !verticalAnchors.every(isFiniteNumber) ||
    !horizontalAnchors.every(isFiniteNumber)
  ) {
    return invalidSavedLayout(
      `floatingGroups.${index} position must have one finite anchor per axis`,
    );
  }
}

function validateMaximizedNode(
  maximizedNode: unknown,
  root: unknown,
  label: string,
): void {
  if (
    !isPlainRecord(maximizedNode) ||
    !Array.isArray(maximizedNode.location) ||
    !maximizedNode.location.every(
      (segment) => Number.isInteger(segment) && segment >= 0,
    )
  ) {
    return invalidSavedLayout(`${label} maximized node location is invalid`);
  }

  let node = root;
  for (const segment of maximizedNode.location) {
    if (
      !isPlainRecord(node) ||
      node.type !== 'branch' ||
      !Array.isArray(node.data) ||
      segment >= node.data.length
    ) {
      return invalidSavedLayout(
        `${label} maximized node does not reference the grid`,
      );
    }
    node = node.data[segment];
  }
}

function validatePopoutGroups(popoutGroups: unknown): void {
  if (popoutGroups !== undefined && !Array.isArray(popoutGroups)) {
    return invalidSavedLayout('popoutGroups must be an array');
  }
  if (Array.isArray(popoutGroups) && popoutGroups.length > 0) {
    return invalidSavedLayout(
      'layouts with external-window groups are not supported',
    );
  }
}

function invalidSavedLayout(message: string): never {
  throw new TypeError(`Saved workspace ${message}.`);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
