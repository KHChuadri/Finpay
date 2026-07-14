import { cn } from '@/lib/utils';

const checks = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Upper & lowercase', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One symbol', test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
];

export function PasswordStrength({ password }: { password: string }) {
  const met = checks.filter((c) => c.test(password)).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1 rounded-full', i < met ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>
      <ul className="flex flex-col gap-1">
        {checks.map((c) => {
          const ok = c.test(password);
          return (
            <li key={c.label} className={cn('flex items-center gap-2 text-[12px]', ok ? 'text-primary' : 'text-subtle')}>
              <span aria-hidden>{ok ? '✓' : '○'}</span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { checks as passwordChecks };
