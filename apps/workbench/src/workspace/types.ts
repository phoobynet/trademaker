import type { Component } from 'vue';

export type SerializablePrimitive = string | number | boolean | null;

export type SerializableValue =
  | SerializablePrimitive
  | SerializableValue[]
  | { [key: string]: SerializableValue };

export type SerializablePanelParameters = Record<string, SerializableValue>;

export type SerializablePanelState = Record<string, SerializableValue>;

export type PanelType =
  | 'news-source'
  | 'evidence-claims'
  | 'primary-security'
  | 'related-companies'
  | 'wider-market'
  | 'guided-interpretation';

export interface WorkspacePanelDefinition {
  type: PanelType;
  title: string;
  component: Component;
  createDefaultParameters: () => SerializablePanelParameters;
  createDefaultState: () => SerializablePanelState;
}

export interface WorkspacePanelInstance {
  instanceId: string;
  type: PanelType;
  title: string;
  parameters: SerializablePanelParameters;
}

export type PanelPlacement =
  | { kind: 'default' }
  | {
      kind: 'relative';
      referenceInstanceId: string;
      position: 'left' | 'right' | 'above' | 'below' | 'tab';
    };

export interface MinimizedPanelRecord extends WorkspacePanelInstance {
  restorePlacement: PanelPlacement;
}

export interface WorkspaceCommands {
  openPanel(type: PanelType): void;
  closePanel(instanceId: string): void;
  minimizePanel(instanceId: string): void;
  restorePanel(instanceId: string): void;
  toggleMaximize(instanceId: string): void;
  floatPanel(instanceId: string): void;
  resetWorkspace(): void;
}

export function cloneSerializableRecord(
  value: SerializablePanelParameters | SerializablePanelState,
): Record<string, SerializableValue> {
  const clone = cloneSerializableValue(value, new WeakSet());
  if (clone === null || Array.isArray(clone) || typeof clone !== 'object') {
    throw new TypeError('Panel data must use an object at its top level.');
  }
  return clone;
}

function cloneSerializableValue(
  value: SerializableValue,
  ancestors: WeakSet<object>,
): SerializableValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Serializable numbers must be finite.');
    }
    return value;
  }

  if (typeof value !== 'object') {
    throw new TypeError('Panel data must contain only JSON-compatible values.');
  }

  if (ancestors.has(value)) {
    throw new TypeError('Panel data cannot contain circular references.');
  }
  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      const clone: SerializableValue[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value)) {
          throw new TypeError(
            'Serializable arrays cannot contain empty slots.',
          );
        }
        clone.push(cloneSerializableValue(value[index]!, ancestors));
      }
      return clone;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(
        'Serializable objects must use a plain object shape.',
      );
    }

    if (Reflect.ownKeys(value).some((key) => typeof key === 'symbol')) {
      throw new TypeError('Serializable objects cannot use symbol keys.');
    }

    const clone: Record<string, SerializableValue> = {};
    for (const [key, child] of Object.entries(value)) {
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        value: cloneSerializableValue(child, ancestors),
        writable: true,
      });
    }
    return clone;
  } finally {
    ancestors.delete(value);
  }
}
