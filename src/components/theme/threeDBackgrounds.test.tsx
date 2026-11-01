/**
 * US-260: the profile's 3D theme backgrounds rendered at the device's full
 * pixel ratio (3x on a modern phone) and kept rendering in a hidden tab, and
 * their lazy wrappers fetched Three.js on first render regardless of the
 * visitor's motion and data settings.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import type { ReactNode } from 'react';

const canvasProps: Record<string, unknown>[] = [];

vi.mock('@react-three/fiber', () => ({
  Canvas: (props: Record<string, unknown> & { children?: ReactNode }) => {
    const { children: _children, ...rest } = props;
    canvasProps.push(rest);
    return <canvas data-testid="r3f-canvas" />;
  },
  useFrame: () => undefined,
}));
vi.mock('@react-three/drei', () => ({
  Points: () => null,
  PointMaterial: () => null,
}));

let deferredReady = false;
vi.mock('@/hooks/useDeferred3D', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useDeferred3D')>()),
  useDeferred3D: () => deferredReady,
}));

import { ThreeDBackground } from './ThreeDBackground';
import { GradientMesh } from './GradientMesh';
import { FloatingGeometry } from './FloatingGeometry';
import { GradientMesh as GradientMeshLazy } from './GradientMeshLazy';

let visibility: DocumentVisibilityState = 'visible';

beforeEach(() => {
  canvasProps.length = 0;
  deferredReady = false;
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibility,
  });
});

describe.each([
  ['ThreeDBackground', () => <ThreeDBackground variant="particles" />],
  ['GradientMesh', () => <GradientMesh />],
  ['FloatingGeometry', () => <FloatingGeometry />],
])('%s canvas', (_name, element) => {
  it('caps dpr at [1, 1.5] and pauses the frameloop while the tab is hidden', () => {
    render(element());
    expect(canvasProps.at(-1)).toMatchObject({ dpr: [1, 1.5], frameloop: 'always' });

    act(() => {
      visibility = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(canvasProps.at(-1)).toMatchObject({ frameloop: 'never' });
  });
});

describe('lazy 3D wrapper', () => {
  it('draws only the static gradient, and no canvas, until useDeferred3D says so', async () => {
    const { container, findByTestId, rerender } = render(<GradientMeshLazy />);
    expect(container.querySelector('canvas')).toBeNull();
    expect((container.firstElementChild as HTMLElement).style.background).toContain(
      'radial-gradient'
    );

    deferredReady = true;
    rerender(<GradientMeshLazy color1="#123456" />);
    expect(await findByTestId('r3f-canvas')).toBeInTheDocument();
  });
});
