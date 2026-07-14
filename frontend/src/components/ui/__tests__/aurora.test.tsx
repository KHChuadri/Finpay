import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { AuroraBackground } from '../AuroraBackground';

describe('AuroraBackground', () => {
  it('renders a decorative, aria-hidden, non-interactive layer', () => {
    const { container } = render(<AuroraBackground />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root.className).toContain('pointer-events-none');
    expect(root.className).toContain('fixed');
  });
});
