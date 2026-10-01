/**
 * US-236: the WebGL theme backgrounds ran useFrame loops forever. With
 * animate={false} the Canvas uses frameloop="demand": one still frame.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

const frameloops: string[] = [];
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ frameloop, children: _children }: { frameloop: string; children: ReactNode }) => {
    frameloops.push(frameloop);
    return <canvas data-frameloop={frameloop} />;
  },
  useFrame: vi.fn(),
}));
vi.mock('@react-three/drei', () => ({ Points: () => null, PointMaterial: () => null }));

import { GradientMesh } from './GradientMesh';
import { FloatingGeometry } from './FloatingGeometry';
import { ThreeDBackground } from './ThreeDBackground';

describe.each([
  ['GradientMesh', (animate: boolean) => <GradientMesh animate={animate} />],
  ['FloatingGeometry', (animate: boolean) => <FloatingGeometry animate={animate} />],
  ['ThreeDBackground', (animate: boolean) => <ThreeDBackground variant="particles" animate={animate} />],
])('%s', (_name, el) => {
  it('loops when animating and draws a still frame when not', () => {
    const { container, rerender } = render(el(true));
    expect(container.querySelector('canvas')).toHaveAttribute('data-frameloop', 'always');
    rerender(el(false));
    expect(container.querySelector('canvas')).toHaveAttribute('data-frameloop', 'demand');
  });

  it('is hidden from assistive technology', () => {
    const { container } = render(el(true));
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
