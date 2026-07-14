import useDarkModeStore, { syncThemeClass } from '../darkModeStore';

describe('darkModeStore theme class', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
    useDarkModeStore.setState({ darkMode: false });
  });

  it('adds .dark to <html> when enabled', () => {
    useDarkModeStore.getState().setDarkMode(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes .dark from <html> when disabled', () => {
    useDarkModeStore.getState().setDarkMode(true);
    useDarkModeStore.getState().setDarkMode(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('syncThemeClass reflects the boolean', () => {
    syncThemeClass(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    syncThemeClass(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
