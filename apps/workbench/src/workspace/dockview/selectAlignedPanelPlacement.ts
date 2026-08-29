import type { PanelPlacement } from '../types';

export interface PanelBounds {
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface PanelPlacementCandidate {
  bounds: PanelBounds;
  instanceId: string;
}

interface SpatialRelationship {
  distance: number;
  overlap: number;
  position: 'above' | 'below' | 'left' | 'right';
  referenceInstanceId: string;
}

const oppositePosition = {
  above: 'below',
  below: 'above',
  left: 'right',
  right: 'left',
} as const;

export function selectAlignedPanelPlacement(
  targetBounds: PanelBounds,
  candidates: readonly PanelPlacementCandidate[],
): PanelPlacement {
  const relationships = candidates.flatMap((candidate) =>
    collectRelationships(targetBounds, candidate),
  );
  relationships.sort(
    (left, right) =>
      left.distance - right.distance ||
      right.overlap - left.overlap ||
      left.referenceInstanceId.localeCompare(right.referenceInstanceId) ||
      left.position.localeCompare(right.position),
  );
  const reference = relationships[0];
  if (!reference) return { kind: 'default' };

  return {
    kind: 'relative',
    referenceInstanceId: reference.referenceInstanceId,
    position: oppositePosition[reference.position],
  };
}

function collectRelationships(
  targetBounds: PanelBounds,
  candidate: PanelPlacementCandidate,
): SpatialRelationship[] {
  const bounds = candidate.bounds;
  const xOverlap = intervalOverlap(
    targetBounds.left,
    targetBounds.left + targetBounds.width,
    bounds.left,
    bounds.left + bounds.width,
  );
  const yOverlap = intervalOverlap(
    targetBounds.top,
    targetBounds.top + targetBounds.height,
    bounds.top,
    bounds.top + bounds.height,
  );
  const relationships: SpatialRelationship[] = [];

  if (yOverlap > 0 && bounds.left + bounds.width <= targetBounds.left) {
    relationships.push({
      distance: targetBounds.left - (bounds.left + bounds.width),
      overlap: yOverlap,
      position: 'left',
      referenceInstanceId: candidate.instanceId,
    });
  }
  if (
    yOverlap > 0 &&
    bounds.left >= targetBounds.left + targetBounds.width
  ) {
    relationships.push({
      distance: bounds.left - (targetBounds.left + targetBounds.width),
      overlap: yOverlap,
      position: 'right',
      referenceInstanceId: candidate.instanceId,
    });
  }
  if (xOverlap > 0 && bounds.top + bounds.height <= targetBounds.top) {
    relationships.push({
      distance: targetBounds.top - (bounds.top + bounds.height),
      overlap: xOverlap,
      position: 'above',
      referenceInstanceId: candidate.instanceId,
    });
  }
  if (
    xOverlap > 0 &&
    bounds.top >= targetBounds.top + targetBounds.height
  ) {
    relationships.push({
      distance: bounds.top - (targetBounds.top + targetBounds.height),
      overlap: xOverlap,
      position: 'below',
      referenceInstanceId: candidate.instanceId,
    });
  }

  return relationships;
}

function intervalOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): number {
  return Math.max(
    0,
    Math.min(firstEnd, secondEnd) - Math.max(firstStart, secondStart),
  );
}
