# Address Autocomplete Component

The `AddressAutocomplete` component provides Google Places API integration for address input fields with autocomplete functionality.

## Features

- **Real-time autocomplete**: Suggests addresses as users type (minimum 3 characters)
- **Memoized caching**: Results are cached to improve performance and reduce API calls
- **Keyboard navigation**: Arrow keys, Enter, and Escape support
- **Debounced search**: 300ms delay to prevent excessive API calls
- **US address restriction**: Currently restricted to US addresses
- **Loading states**: Visual feedback during API calls
- **Error handling**: Graceful fallback when API key is missing

## Usage

```tsx
import { AddressAutocomplete } from "@components/ui/address-autocomplete";

function MyForm() {
  const [address, setAddress] = useState("");

  return (
    <AddressAutocomplete
      id="address"
      label="Address"
      value={address}
      onChange={setAddress}
      placeholder="Enter your address"
      required
    />
  );
}
```

## Props

| Prop          | Type                      | Required | Description                                    |
| ------------- | ------------------------- | -------- | ---------------------------------------------- |
| `id`          | `string`                  | Yes      | Unique identifier for the input field          |
| `label`       | `string`                  | Yes      | Label text displayed above the input           |
| `value`       | `string`                  | Yes      | Current value of the input                     |
| `onChange`    | `(value: string) => void` | Yes      | Callback when value changes                    |
| `placeholder` | `string`                  | No       | Placeholder text for the input                 |
| `required`    | `boolean`                 | No       | Whether the field is required (default: false) |
| `className`   | `string`                  | No       | Additional CSS classes                         |

## Setup

1. **Get a Google Maps API Key**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the **Places API**
   - Create an API key in the Credentials section

2. **Add the API Key to Environment Variables**:

   ```bash
   # .env.local
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **Install Dependencies** (if not already installed):
   ```bash
   yarn add @googlemaps/js-api-loader
   yarn add -D @types/google.maps
   ```

## Implementation Details

### Caching

The component uses a global `Map` to cache autocomplete results. This reduces API calls for repeated searches and improves performance.

### Debouncing

Search requests are debounced with a 300ms delay to prevent excessive API calls while the user is typing.

### Error Handling

- If the API key is missing, the component logs a warning and functions as a regular input
- API errors are logged to the console
- The component gracefully handles network failures

### Keyboard Navigation

- **Arrow Down/Up**: Navigate through suggestions
- **Enter**: Select the highlighted suggestion
- **Escape**: Close the dropdown
- **Tab**: Move to next field (closes dropdown)

## Performance Considerations

- Results are cached in memory (not persisted)
- API calls are debounced to reduce rate limiting
- Component is memoized to prevent unnecessary re-renders
- Google Maps API is loaded only when needed

## Limitations

- Currently restricted to US addresses
- Requires internet connection for API calls
- Subject to Google Maps API usage limits and costs
- Cache is not persisted across page reloads

## Future Enhancements

- Support for international addresses
- Persistent caching with localStorage
- Custom address validation
- Distance calculation between addresses
- Integration with mapping components
