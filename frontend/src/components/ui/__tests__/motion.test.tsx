import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';
import { CountUp } from '../CountUp';

describe('motion primitives', () => {
  it('ProgressBar clamps width to 100%', () => {
    const { container } = render(<ProgressBar value={150} max={100} />);
    const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('ProgressBar computes partial width', () => {
    const { container } = render(<ProgressBar value={25} max={100} />);
    const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement;
    expect(fill.style.width).toBe('25%');
  });

  it('CountUp eventually shows the formatted target', async () => {
    render(<CountUp value={1234.5} />);
    expect(await screen.findByText('1,234.50')).toBeInTheDocument();
  });
});
