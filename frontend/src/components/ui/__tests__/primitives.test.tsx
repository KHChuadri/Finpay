import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Pill } from '../Pill';
import { Input } from '../Input';

describe('ui primitives', () => {
  it('Card renders children and uses card bg', () => {
    render(<Card>hello</Card>);
    const el = screen.getByText('hello');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('bg-card');
  });

  it('Card emphasis uses strong border', () => {
    render(<Card emphasis>x</Card>);
    expect(screen.getByText('x').className).toContain('border-border-strong');
  });

  it('Button primary uses primary bg and forwards onClick', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn.className).toContain('bg-primary');
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('Button ghost uses transparent/hairline style', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: 'Ghost' }).className).toContain('border');
  });

  it('Pill renders mono hairline', () => {
    render(<Pill>LVL 12</Pill>);
    expect(screen.getByText('LVL 12').className).toContain('font-mono');
  });

  it('Input uses input border by default', () => {
    render(<Input placeholder="name" />);
    expect(screen.getByPlaceholderText('name').className).toContain('border-input');
  });

  it('Input error swaps to destructive border', () => {
    render(<Input placeholder="bad" error />);
    expect(screen.getByPlaceholderText('bad').className).toContain('border-destructive');
  });
});
