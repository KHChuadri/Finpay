import ListGroup from '@/components/dashboard/ListGroup';

// Buttons navigate — DsRouter provider supplies the router.
export const Default = () => (
  <ListGroup items={[{ Name: 'Profile', Route: '/profile' }, { Name: 'Settings', Route: '/settings' }, { Name: 'Log out', Route: '/logout' }]} />
);
