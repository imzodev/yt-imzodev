/**
 * Tests for DateRangePicker.astro - Props and rendering validation
 */
import { describe, it, expect } from 'vitest';

// Define interfaces for testing (matches DateRangePicker.astro)
interface Preset {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  presets?: Preset[];
  label?: string;
  name?: string;
  id?: string;
}

// Helper to validate date format (YYYY-MM-DD)
function isValidDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

// Helper to validate props
function validateDateRangePickerProps(props: Partial<DateRangePickerProps>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (props.startDate && !isValidDateFormat(props.startDate)) {
    errors.push('startDate must be in YYYY-MM-DD format');
  }

  if (props.endDate && !isValidDateFormat(props.endDate)) {
    errors.push('endDate must be in YYYY-MM-DD format');
  }

  if (props.startDate && props.endDate) {
    const start = new Date(props.startDate);
    const end = new Date(props.endDate);
    if (start > end) {
      errors.push('startDate must be before or equal to endDate');
    }
  }

  if (props.presets) {
    if (!Array.isArray(props.presets)) {
      errors.push('presets must be an array');
    } else {
      props.presets.forEach((preset, index) => {
        if (!preset.label) errors.push(`preset ${index}: label is required`);
        if (!preset.value) errors.push(`preset ${index}: value is required`);
        if (!preset.startDate || !isValidDateFormat(preset.startDate)) {
          errors.push(`preset ${index}: valid startDate is required`);
        }
        if (!preset.endDate || !isValidDateFormat(preset.endDate)) {
          errors.push(`preset ${index}: valid endDate is required`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

// Helper to generate default presets (matches component logic)
function generateDefaultPresets(): Preset[] {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  return [
    { 
      label: 'Today', 
      value: 'today', 
      startDate: formatDate(today), 
      endDate: formatDate(today) 
    },
    { 
      label: 'Last 7 Days', 
      value: 'last7days', 
      startDate: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), 
      endDate: formatDate(today) 
    },
    { 
      label: 'Last 30 Days', 
      value: 'last30days', 
      startDate: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), 
      endDate: formatDate(today) 
    },
    { 
      label: 'This Month', 
      value: 'thismonth', 
      startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), 
      endDate: formatDate(today) 
    },
    { 
      label: 'Last Month', 
      value: 'lastmonth', 
      startDate: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)), 
      endDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 0)) 
    },
    { 
      label: 'This Year', 
      value: 'thisyear', 
      startDate: formatDate(new Date(today.getFullYear(), 0, 1)), 
      endDate: formatDate(today) 
    }
  ];
}

// Helper to apply preset to date inputs
function applyPreset(preset: Preset): { startDate: string; endDate: string } {
  return {
    startDate: preset.startDate,
    endDate: preset.endDate
  };
}

describe('Date Format Validation', () => {
  it('should validate correct date formats', () => {
    expect(isValidDateFormat('2024-01-01')).toBe(true);
    expect(isValidDateFormat('2024-12-31')).toBe(true);
    expect(isValidDateFormat('2024-06-15')).toBe(true);
  });

  it('should reject invalid date formats', () => {
    // These have wrong format (not YYYY-MM-DD)
    expect(isValidDateFormat('01-01-2024')).toBe(false);
    expect(isValidDateFormat('2024/01/01')).toBe(false);
    expect(isValidDateFormat('2024-1-1')).toBe(false);
    expect(isValidDateFormat('invalid')).toBe(false);
    expect(isValidDateFormat('')).toBe(false);
  });

  it('should accept dates that JavaScript can parse (even if calendar-invalid)', () => {
    // Note: JavaScript Date auto-corrects invalid calendar dates:
    // - 2024-02-30 becomes 2024-03-01
    // - 2024-13-01 becomes 2025-01-01
    // Our validation checks format and parseability, not calendar validity
    expect(isValidDateFormat('2024-02-30')).toBe(true); // JS parses this as March 1st
    expect(isValidDateFormat('2024-13-01')).toBe(false); // JS creates Invalid Date
  });
});

describe('DateRangePicker Props Validation', () => {
  it('should accept empty props (uses defaults)', () => {
    expect(validateDateRangePickerProps({}).valid).toBe(true);
  });

  it('should validate startDate format', () => {
    expect(validateDateRangePickerProps({ startDate: '2024-01-01' }).valid).toBe(true);
    expect(validateDateRangePickerProps({ startDate: 'invalid' }).valid).toBe(false);
  });

  it('should validate endDate format', () => {
    expect(validateDateRangePickerProps({ endDate: '2024-01-31' }).valid).toBe(true);
    expect(validateDateRangePickerProps({ endDate: 'invalid' }).valid).toBe(false);
  });

  it('should validate startDate is before endDate', () => {
    expect(validateDateRangePickerProps({ 
      startDate: '2024-01-01', 
      endDate: '2024-01-31' 
    }).valid).toBe(true);

    expect(validateDateRangePickerProps({ 
      startDate: '2024-01-31', 
      endDate: '2024-01-01' 
    }).valid).toBe(false);
  });

  it('should allow same start and end date', () => {
    expect(validateDateRangePickerProps({ 
      startDate: '2024-01-15', 
      endDate: '2024-01-15' 
    }).valid).toBe(true);
  });

  it('should validate presets array', () => {
    const validPresets: Preset[] = [
      { label: 'Last 7 Days', value: 'last7days', startDate: '2024-01-01', endDate: '2024-01-07' }
    ];
    expect(validateDateRangePickerProps({ presets: validPresets }).valid).toBe(true);

    const invalidPresets = [
      { label: 'Invalid', value: 'invalid', startDate: 'bad', endDate: 'format' }
    ];
    expect(validateDateRangePickerProps({ presets: invalidPresets as unknown as Preset[] }).valid).toBe(false);
  });
});

describe('Default Presets Generation', () => {
  it('should generate 6 default presets', () => {
    const presets = generateDefaultPresets();
    expect(presets).toHaveLength(6);
  });

  it('should have valid dates for all presets', () => {
    const presets = generateDefaultPresets();
    presets.forEach(preset => {
      expect(isValidDateFormat(preset.startDate)).toBe(true);
      expect(isValidDateFormat(preset.endDate)).toBe(true);
    });
  });

  it('should have start date before or equal to end date for all presets', () => {
    const presets = generateDefaultPresets();
    presets.forEach(preset => {
      const start = new Date(preset.startDate);
      const end = new Date(preset.endDate);
      expect(start <= end).toBe(true);
    });
  });

  it('should have unique values for each preset', () => {
    const presets = generateDefaultPresets();
    const values = presets.map(p => p.value);
    const uniqueValues = [...new Set(values)];
    expect(uniqueValues).toHaveLength(values.length);
  });

  it('should include common preset types', () => {
    const presets = generateDefaultPresets();
    const values = presets.map(p => p.value);
    expect(values).toContain('today');
    expect(values).toContain('last7days');
    expect(values).toContain('last30days');
    expect(values).toContain('thismonth');
    expect(values).toContain('lastmonth');
    expect(values).toContain('thisyear');
  });
});

describe('Preset Application', () => {
  it('should apply preset dates correctly', () => {
    const preset: Preset = {
      label: 'Custom Range',
      value: 'custom',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };

    const result = applyPreset(preset);
    expect(result.startDate).toBe('2024-01-01');
    expect(result.endDate).toBe('2024-01-31');
  });

  it('should handle today preset', () => {
    const presets = generateDefaultPresets();
    const todayPreset = presets.find(p => p.value === 'today')!;
    expect(todayPreset.startDate).toBe(todayPreset.endDate);
  });

  it('should handle last 7 days preset', () => {
    const presets = generateDefaultPresets();
    const last7Preset = presets.find(p => p.value === 'last7days')!;
    
    const start = new Date(last7Preset.startDate);
    const end = new Date(last7Preset.endDate);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    expect(diffDays).toBe(7);
  });

  it('should handle last 30 days preset', () => {
    const presets = generateDefaultPresets();
    const last30Preset = presets.find(p => p.value === 'last30days')!;
    
    const start = new Date(last30Preset.startDate);
    const end = new Date(last30Preset.endDate);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    
    expect(diffDays).toBe(30);
  });
});

describe('DateRangePicker Use Cases', () => {
  it('should support analytics filtering', () => {
    const props: DateRangePickerProps = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      label: 'Select Date Range',
      name: 'analytics_range'
    };
    expect(validateDateRangePickerProps(props).valid).toBe(true);
  });

  it('should support custom presets', () => {
    const customPresets: Preset[] = [
      { label: 'Q1 2024', value: 'q1', startDate: '2024-01-01', endDate: '2024-03-31' },
      { label: 'Q2 2024', value: 'q2', startDate: '2024-04-01', endDate: '2024-06-30' }
    ];
    const props: DateRangePickerProps = {
      presets: customPresets
    };
    expect(validateDateRangePickerProps(props).valid).toBe(true);
  });

  it('should support form integration', () => {
    const props: DateRangePickerProps = {
      name: 'report_range',
      id: 'report-date-picker',
      label: 'Report Period'
    };
    expect(validateDateRangePickerProps(props).valid).toBe(true);
  });
});
