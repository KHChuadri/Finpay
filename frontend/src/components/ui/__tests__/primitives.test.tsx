import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Pill } from '../Pill';
import { Input } from '../Input';
import { Label } from '../Label';
import { PageContainer } from '../PageContainer';

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
    expect(btn.className).toContain('text-primary-foreground');
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('Button ghost uses transparent/hairline style', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: 'Ghost' }).className).toContain('bg-transparent');
    expect(screen.getByRole('button', { name: 'Ghost' }).className).toContain('hover:bg-hover');
  });

  it('Pill renders mono hairline', () => {
    render(<Pill>LVL 12</Pill>);
    expect(screen.getByText('LVL 12').className).toContain('font-mono');
  });

  it('Input uses input border by default', () => {
    render(<Input placeholder="name" />);
    expect(screen.getByPlaceholderText('name').className).toContain('border-border-strong');
  });

  it('Input error swaps to destructive border', () => {
    render(<Input placeholder="bad" error />);
    expect(screen.getByPlaceholderText('bad').className).toContain('border-destructive');
  });

  it('Label renders a required asterisk in destructive color', () => {
    render(<Label required>Email</Label>);
    const star = screen.getByText('*');
    expect(star.className).toContain('text-destructive');
  });

  it('PageContainer defaults to max-w-6xl and narrow to max-w-md', () => {
    const { rerender } = render(<PageContainer>a</PageContainer>);
    expect(screen.getByText('a').className).toContain('max-w-6xl');
    rerender(<PageContainer size="narrow">b</PageContainer>);
    expect(screen.getByText('b').className).toContain('max-w-md');
  });

  it('Button destructive variant uses destructive bg', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByText('Delete').className).toContain('bg-destructive-tint');
  });
});
