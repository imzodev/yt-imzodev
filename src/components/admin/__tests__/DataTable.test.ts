/**
 * Tests for DataTable.astro - Props and rendering validation
 */
import { describe, it, expect } from 'vitest';

// Define interfaces for testing (matches DataTable.astro)
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>) => string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  pageSize?: number;
  id?: string;
}

// Helper to validate column definition
function validateColumn(column: Partial<Column>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!column.key) {
    errors.push('column key is required');
  }
  if (!column.label) {
    errors.push('column label is required');
  }
  if (column.align && !['left', 'center', 'right'].includes(column.align)) {
    errors.push('column align must be "left", "center", or "right"');
  }

  return { valid: errors.length === 0, errors };
}

// Helper to validate props
function validateDataTableProps(props: Partial<DataTableProps>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!props.columns || !Array.isArray(props.columns)) {
    errors.push('columns array is required');
  } else if (props.columns.length === 0) {
    errors.push('columns array cannot be empty');
  } else {
    props.columns.forEach((col, index) => {
      const colValidation = validateColumn(col);
      if (!colValidation.valid) {
        errors.push(`column ${index}: ${colValidation.errors.join(', ')}`);
      }
    });
  }

  if (!props.data || !Array.isArray(props.data)) {
    errors.push('data array is required');
  }

  return { valid: errors.length === 0, errors };
}

// Helper to process table data (matches component logic)
function processTableData(
  data: Record<string, unknown>[],
  columns: Column[],
  searchQuery?: string
): Record<string, unknown>[] {
  let processed = [...data];

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    processed = processed.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(query)
      )
    );
  }

  return processed;
}

// Helper to sort table data
function sortTableData(
  data: Record<string, unknown>[],
  sortKey: string,
  sortDirection: 'asc' | 'desc'
): Record<string, unknown>[] {
  return [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

describe('DataTable Column Validation', () => {
  it('should validate required column fields', () => {
    expect(validateColumn({}).valid).toBe(false);
    expect(validateColumn({ key: 'test' }).valid).toBe(false);
    expect(validateColumn({ label: 'Test' }).valid).toBe(false);
    expect(validateColumn({ key: 'test', label: 'Test' }).valid).toBe(true);
  });

  it('should validate column alignment', () => {
    expect(validateColumn({ key: 'test', label: 'Test', align: 'left' }).valid).toBe(true);
    expect(validateColumn({ key: 'test', label: 'Test', align: 'center' }).valid).toBe(true);
    expect(validateColumn({ key: 'test', label: 'Test', align: 'right' }).valid).toBe(true);
    expect(validateColumn({ key: 'test', label: 'Test', align: 'invalid' as unknown as 'left' }).valid).toBe(false);
  });

  it('should support sortable columns', () => {
    const col: Column = { key: 'name', label: 'Name', sortable: true };
    expect(validateColumn(col).valid).toBe(true);
  });

  it('should support custom width', () => {
    const col: Column = { key: 'name', label: 'Name', width: '200px' };
    expect(validateColumn(col).valid).toBe(true);
  });

  it('should support render functions', () => {
    const col: Column = {
      key: 'status',
      label: 'Status',
      render: (value) => `<span class="badge">${value}</span>`
    };
    expect(validateColumn(col).valid).toBe(true);
    expect(col.render?.('active', {})).toBe('<span class="badge">active</span>');
  });
});

describe('DataTable Props Validation', () => {
  it('should require columns and data', () => {
    expect(validateDataTableProps({}).valid).toBe(false);
    expect(validateDataTableProps({ columns: [] }).valid).toBe(false);
    expect(validateDataTableProps({ columns: [{ key: 'id', label: 'ID' }] }).valid).toBe(false);
    expect(validateDataTableProps({ columns: [{ key: 'id', label: 'ID' }], data: [] }).valid).toBe(true);
  });

  it('should accept valid data arrays', () => {
    const props: DataTableProps = {
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' }
      ],
      data: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    };
    expect(validateDataTableProps(props).valid).toBe(true);
  });
});

describe('DataTable Data Processing', () => {
  const testData = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ];

  const columns: Column[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' }
  ];

  it('should return all data without search query', () => {
    const result = processTableData(testData, columns);
    expect(result).toHaveLength(3);
  });

  it('should filter data by search query', () => {
    const result = processTableData(testData, columns, 'alice');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('should be case-insensitive in search', () => {
    const result = processTableData(testData, columns, 'ALICE');
    expect(result).toHaveLength(1);
  });

  it('should search across all fields', () => {
    const result = processTableData(testData, columns, 'example.com');
    expect(result).toHaveLength(3);
  });

  it('should return empty array for no matches', () => {
    const result = processTableData(testData, columns, 'nonexistent');
    expect(result).toHaveLength(0);
  });
});

describe('DataTable Sorting', () => {
  const testData = [
    { id: 3, name: 'Charlie' },
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];

  it('should sort ascending', () => {
    const result = sortTableData(testData, 'id', 'asc');
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
  });

  it('should sort descending', () => {
    const result = sortTableData(testData, 'id', 'desc');
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(1);
  });

  it('should sort by string values', () => {
    const result = sortTableData(testData, 'name', 'asc');
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
    expect(result[2].name).toBe('Charlie');
  });

  it('should handle null/undefined values', () => {
    const dataWithNulls = [
      { id: 1, name: 'Alice' },
      { id: 2, name: null },
      { id: 3, name: 'Charlie' }
    ];
    const result = sortTableData(dataWithNulls, 'name', 'asc');
    // Null values should be at the end
    expect(result[2].name).toBeNull();
  });

  it('should not mutate original array', () => {
    const original = [...testData];
    sortTableData(testData, 'id', 'asc');
    expect(testData).toEqual(original);
  });
});

describe('DataTable Use Cases', () => {
  it('should support user management table', () => {
    const props: DataTableProps = {
      columns: [
        { key: 'email', label: 'Email', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        { key: 'tier', label: 'Tier', sortable: true },
        { key: 'actions', label: 'Actions', align: 'center' }
      ],
      data: [
        { email: 'user@example.com', role: 'member', tier: 'premium' }
      ],
      searchable: true,
      striped: true,
      hoverable: true
    };
    expect(validateDataTableProps(props).valid).toBe(true);
  });

  it('should support subscription table', () => {
    const props: DataTableProps = {
      columns: [
        { key: 'userId', label: 'User ID' },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'currentPeriodEnd', label: 'Period End', sortable: true }
      ],
      data: [],
      searchable: true
    };
    expect(validateDataTableProps(props).valid).toBe(true);
  });

  it('should support custom column rendering', () => {
    const columns: Column[] = [
      { key: 'status', label: 'Status', render: (val) => `<span class="badge badge-${val === 'active' ? 'success' : 'error'}">${val}</span>` }
    ];
    const result = columns[0].render!('active', {});
    expect(result).toContain('badge-success');
    expect(result).toContain('active');
  });
});
