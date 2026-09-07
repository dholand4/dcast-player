---
name: front-react
description: Enforce React/React Native conventions for TypeScript code. Use when creating, editing, reviewing, or planning screens, components, hooks, navigation, services, or any file under src/.
---

# Front React

Treat every rule here as mandatory.

## Folder Structure

```text
src/
  @types/       global typings
  assets/       images, fonts, icons
  components/   reusable UI (e.g. buttonGlobal)
  constants/    fixed values
  hooks/        custom hooks (useXxx)
  providers/    global context
  routes/       React Navigation stacks
  services/     API and integrations
  utils/        pure functions
  view/
    screenName/
      index.tsx
      style.ts
      __tests__/index.test.tsx
```

No folders outside this structure. Every screen goes in `src/view/<screenName>/`.

## Naming

| Artifact | Convention | Example |
|---|---|---|
| Component | camelCase + Global | `buttonGlobal`, `inputGlobal` |
| Component folder | same as component | `src/components/buttonGlobal/` |
| Screen folder | camelCase + Screen | `src/view/homeScreen/` |
| Hook | `use` prefix | `useAuth`, `useCart` |
| Service | `Service` suffix | `authService` |
| Interface | `I` prefix | `IButtonProps` |
| Test | source name + `.test` | `index.test.tsx` |

## Before Implementing

1. Identify files to create or modify.
2. Search `src/components` for reusable components — reuse before creating.
3. For 3+ file changes, state the plan briefly before editing.

## Component Rules

Structure — `index.tsx` (JSX only) · `style.ts` (styled-components only) · `types.ts` (interfaces) · `__tests__/index.test.tsx`

Extend, don't duplicate:
```ts
const SecondaryButton = styled(ButtonGlobal)`
  background-color: ${({ theme }) => theme.colors.secondary};
`;
```

Components are UI-only. Business logic → `hooks/`, API calls → `services/`, helpers → `utils/`.

## Hook Rules

```ts
// src/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<UserType | null>(null);
  const signIn = useCallback(async (creds: ICredentials) => { /* ... */ }, []);
  return { user, signIn };
}
```

Test at `src/hooks/__tests__/useXxx.test.ts`.

## Navigation (React Navigation)

```text
src/routes/
  index.tsx       root navigator
  AppStack.tsx    authenticated
  AuthStack.tsx   unauthenticated
  types.ts        RootStackParamList
```

Always type params:
```ts
// routes/types.ts
export type RootStackParamList = {
  HomeScreen: undefined;
  ProfileScreen: { userId: string };
};

// in screen
type Props = NativeStackScreenProps<RootStackParamList, 'ProfileScreen'>;
```

No untyped `navigation.navigate`. No navigation logic inside components.

## Styling

Use styled-components + theme tokens. Never hardcode values when a token exists.
```ts
// ❌ margin-top: 10px;  color: red;
// ✅
margin-top: ${({ theme }) => theme.spacing.md}px;
color: ${({ theme }) => theme.colors.primary};
```

## TypeScript

No `any`. Prefer `unknown` + type guard. If unavoidable, cast with a comment:
```ts
// third-party event — no types available yet
const raw = event.data as any; // eslint-disable-line @typescript-eslint/no-explicit-any
```

## Testing

Use `@testing-library/react-native` + Jest. Wrap renders with `ThemeProvider` (and `NavigationContainer` for screens).

**Component**
```tsx
const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ButtonGlobal', () => {
  it('renders label', () => expect(wrap(<ButtonGlobal label="OK" onPress={() => {}} />).getByText('OK')).toBeTruthy());
  it('fires onPress', () => { const fn = jest.fn(); fireEvent.press(wrap(<ButtonGlobal label="OK" onPress={fn} />).getByText('OK')); expect(fn).toHaveBeenCalledTimes(1); });
  it('blocks press when disabled', () => { const fn = jest.fn(); fireEvent.press(wrap(<ButtonGlobal label="OK" onPress={fn} disabled />).getByText('OK')); expect(fn).not.toHaveBeenCalled(); });
});
```

**Hook**
```ts
it('sets user after signIn', async () => {
  const { result } = renderHook(() => useAuth());
  await act(async () => result.current.signIn({ email: 'a@b.com', password: '123' }));
  expect(result.current.user).not.toBeNull();
});
```

**Screen**
```tsx
const wrap = (ui: React.ReactElement) =>
  render(<NavigationContainer><ThemeProvider theme={theme}>{ui}</ThemeProvider></NavigationContainer>);

it('renders without crashing', () => expect(wrap(<HomeScreen />).toJSON()).toBeTruthy());
```

Test behavior, not implementation. Cover: render, interactions, disabled/loading states, async flows, navigation calls.

## Delivery Checklist

Before marking work as done:

- [ ] No folder created outside the defined structure
- [ ] Component names use `camelCase + Global` convention
- [ ] Existing components checked and reused where possible
- [ ] `style.ts` used — no inline styles, no hardcoded theme values
- [ ] No `any` without justification comment
- [ ] Navigation uses typed `RootStackParamList`
- [ ] Tests exist for every new screen, component, and hook
- [ ] No duplication introduced

Fix any failing item before responding.
