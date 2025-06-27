# Owner-Only Access Control

This document describes the owner-only access control system implemented for team pages.

## Overview

The owner-only access control ensures that only team owners can access certain pages and features. Non-owners (members) will see a 404 (Not Found) page when trying to access restricted content.

Additionally, any attempt to access a team that doesn't exist or that the user doesn't have access to will result in a 404 page.

## Protected Pages

The following pages are restricted to team owners only:

- `/dashboard/[accountSlug]/expenses` - Team expenses management
- `/dashboard/[accountSlug]/analytics` - Team analytics and insights
- `/dashboard/[accountSlug]/settings` - Team settings and configuration
- `/dashboard/[accountSlug]/settings/members` - Team member management
- `/dashboard/[accountSlug]/settings/billing` - Team billing management

## 404 Handling

The following scenarios will result in a 404 page:

- **Non-existent teams**: Accessing `/dashboard/foo-bar` where `foo-bar` doesn't exist
- **No access**: Accessing a team that exists but the user doesn't have permission to view
- **Unauthorized access**: Non-owners trying to access owner-only pages

## Implementation

### Utility Functions

Two utility functions are provided in `src/lib/utils/owner-only.tsx`:

#### `OwnerOnlyPage` Component

A higher-order component that wraps page content and enforces owner-only access:

```tsx
import { OwnerOnlyPage } from "@lib/utils/owner-only";

export default async function MyPage({ params }: { params: Promise<{ accountSlug: string }> }) {
  const { accountSlug } = await params;

  return <OwnerOnlyPage accountSlug={accountSlug}>{/* Your page content here */}</OwnerOnlyPage>;
}
```

#### `requireOwnerAccess` Function

A utility function that checks owner access and returns account data:

```tsx
import { requireOwnerAccess } from "@lib/utils/owner-only";

export default async function MyPage({ params }: { params: Promise<{ accountSlug: string }> }) {
  const { accountSlug } = await params;
  const teamAccount = await requireOwnerAccess(accountSlug);

  // teamAccount is guaranteed to exist and user is guaranteed to be an owner
  return <div>Team: {teamAccount.name}</div>;
}
```

### How It Works

1. **Account Validation**: First checks if the account exists using `getAccountBySlug`
2. **Role Verification**: Uses `isUserOwner` to check if the current user has owner role on the account
3. **Access Control**: If either check fails, calls `notFound()` to show a 404 page
4. **Success**: If both checks pass, renders the protected content

### Database Integration

The system leverages existing Basejump functions:

- `public.current_user_account_role(account_id)` - Returns the user's role on an account
- `basejump.has_role_on_account(account_id, 'owner')` - Checks if user has owner role

## Security

- **Server-side validation**: All checks happen on the server side
- **Database-level security**: Uses existing RLS policies and permission functions
- **Consistent behavior**: Returns 404 for unauthorized access (doesn't reveal existence of pages)
- **No client-side bypass**: Cannot be circumvented by client-side manipulation
- **Team access control**: Non-existent or inaccessible teams return 404

## Usage Examples

### For Server Components

```tsx
// Using the component wrapper
<OwnerOnlyPage accountSlug={accountSlug}>
  <MyPageContent />
</OwnerOnlyPage>;

// Using the utility function
const teamAccount = await requireOwnerAccess(accountSlug);
```

### For Client Components

```tsx
// For client components, use the component wrapper
export default function MyClientPage({ params }: { params: Promise<{ accountSlug: string }> }) {
  const [accountSlug, setAccountSlug] = useState<string | null>(null);

  useEffect(() => {
    const loadParams = async () => {
      const { accountSlug: slug } = await params;
      setAccountSlug(slug);
    };
    loadParams();
  }, [params]);

  if (accountSlug == null) {
    return null;
  }

  return (
    <OwnerOnlyPage accountSlug={accountSlug}>
      <MyClientContent accountSlug={accountSlug} />
    </OwnerOnlyPage>
  );
}
```

## Testing

The access control is tested through the existing database tests in `supabase/tests/` which verify:

- Owners can access protected functions
- Members cannot access protected functions
- Non-members cannot access protected functions
- Anonymous users cannot access protected functions

## Future Considerations

- Consider adding role-based navigation hiding for non-owners
- May want to add custom error pages instead of generic 404
- Could extend to support other roles (admin, manager, etc.)
