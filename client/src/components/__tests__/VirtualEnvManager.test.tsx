// /PythonLibraryExplorer/client/src/components/__tests__/VirtualEnvManager.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualEnvManager } from '../VirtualEnvManager';
import { sendExtensionMessage } from '@/lib/queryClient';
import { useVenvStore } from '@/lib/store';

// Create a wrapper component for the query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the dependencies
jest.mock('@/lib/queryClient', () => ({
  sendExtensionMessage: jest.fn(),
  queryClient: new QueryClient(),
}));

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('VirtualEnvManager', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the store
    useVenvStore.getState().setActiveVenv(null);
    // Clear query client
    queryClient.clear();
  });

  it('should deactivate an active environment', async () => {
    // Mock the initial virtual environments data
    (sendExtensionMessage as jest.Mock).mockImplementation((type, data) => {
      if (type === 'listVirtualEnvs') {
        return Promise.resolve([
          {
            id: 'test-env-1',
            name: 'test-env',
            path: './venv',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
      if (type === 'setActiveVenv' && data.id === null) {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve(null);
    });

    // Set initial active environment in the store
    useVenvStore.getState().setActiveVenv({
      id: 'test-env-1',
      name: 'test-env',
      path: './venv',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Render the component
    render(<VirtualEnvManager />, { wrapper });

    // Wait for the environments to load
    await waitFor(() => {
      expect(screen.getByText('test-env')).toBeInTheDocument();
    });

    // Find and click the deactivate button
    const deactivateButton = screen.getByText('Deactivate');
    fireEvent.click(deactivateButton);

    // Verify that sendExtensionMessage was called with the correct arguments
    await waitFor(() => {
      expect(sendExtensionMessage).toHaveBeenCalledWith('setActiveVenv', { id: null });
    });

    // Verify that the store was updated
    await waitFor(() => {
      expect(useVenvStore.getState().activeVenv).toBeNull();
    });

    // Verify that the toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Environment Deactivated",
        description: "Virtual environment deactivated successfully",
      });
    });
  });
}); 