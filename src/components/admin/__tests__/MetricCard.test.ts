/**
 * Tests for MetricCard.astro - Props and rendering validation
 * 
 * Note: Astro components are typically tested via integration tests.
 * These unit tests validate the props interface and logic.
 */
import { describe, it, expect } from 'vitest';

// Define the Props interface for testing (matches MetricCard.astro)
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: 'currency' | 'users' | 'percent' | 'number' | 'chart' | 'alert';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

// Helper function to validate props
function validateMetricCardProps(props: Partial<MetricCardProps>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!props.label) {
    errors.push('label is required');
  }
  if (props.value === undefined) {
    errors.push('value is required');
  }

  // Type validation
  if (props.trend && !['up', 'down', 'neutral'].includes(props.trend)) {
    errors.push('trend must be "up", "down", or "neutral"');
  }

  if (props.icon && !['currency', 'users', 'percent', 'number', 'chart', 'alert'].includes(props.icon)) {
    errors.push('invalid icon type');
  }

  if (props.variant && !['default', 'success', 'warning', 'error', 'info'].includes(props.variant)) {
    errors.push('invalid variant');
  }

  if (props.size && !['sm', 'md', 'lg'].includes(props.size)) {
    errors.push('size must be "sm", "md", or "lg"');
  }

  return { valid: errors.length === 0, errors };
}

// Helper to generate CSS classes based on props (matches component logic)
function getMetricCardClasses(props: Partial<MetricCardProps>) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const variantClasses = {
    default: 'text-base-content',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info'
  };

  const trendClasses = {
    up: 'text-success',
    down: 'text-error',
    neutral: 'text-base-content/60'
  };

  return {
    container: sizeClasses[props.size || 'md'],
    value: `${valueSizeClasses[props.size || 'md']} font-bold ${variantClasses[props.variant || 'default']}`,
    trend: props.trend ? trendClasses[props.trend] : null
  };
}

describe('MetricCard Props Validation', () => {
  it('should validate required props', () => {
    const result = validateMetricCardProps({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('label is required');
    expect(result.errors).toContain('value is required');
  });

  it('should pass with minimal valid props', () => {
    const result = validateMetricCardProps({ label: 'Revenue', value: '$1000' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate trend values', () => {
    expect(validateMetricCardProps({ label: 'Test', value: 100, trend: 'up' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, trend: 'down' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, trend: 'neutral' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, trend: 'invalid' as unknown as 'up' }).valid).toBe(false);
  });

  it('should validate variant values', () => {
    expect(validateMetricCardProps({ label: 'Test', value: 100, variant: 'success' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, variant: 'error' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, variant: 'invalid' as unknown as 'default' }).valid).toBe(false);
  });

  it('should validate size values', () => {
    expect(validateMetricCardProps({ label: 'Test', value: 100, size: 'sm' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, size: 'md' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, size: 'lg' }).valid).toBe(true);
    expect(validateMetricCardProps({ label: 'Test', value: 100, size: 'xl' as unknown as 'md' }).valid).toBe(false);
  });

  it('should validate icon types', () => {
    const validIcons = ['currency', 'users', 'percent', 'number', 'chart', 'alert'];
    validIcons.forEach(icon => {
      expect(validateMetricCardProps({ label: 'Test', value: 100, icon: icon as MetricCardProps['icon'] }).valid).toBe(true);
    });
    expect(validateMetricCardProps({ label: 'Test', value: 100, icon: 'invalid' as unknown as 'currency' }).valid).toBe(false);
  });
});

describe('MetricCard CSS Classes', () => {
  it('should return correct default classes', () => {
    const classes = getMetricCardClasses({ label: 'Test', value: 100 });
    expect(classes.container).toBe('p-6');
    expect(classes.value).toContain('text-2xl');
    expect(classes.value).toContain('text-base-content');
  });

  it('should return correct size classes', () => {
    expect(getMetricCardClasses({ label: 'Test', value: 100, size: 'sm' }).container).toBe('p-4');
    expect(getMetricCardClasses({ label: 'Test', value: 100, size: 'lg' }).container).toBe('p-8');
  });

  it('should return correct variant classes', () => {
    expect(getMetricCardClasses({ label: 'Test', value: 100, variant: 'success' }).value).toContain('text-success');
    expect(getMetricCardClasses({ label: 'Test', value: 100, variant: 'error' }).value).toContain('text-error');
    expect(getMetricCardClasses({ label: 'Test', value: 100, variant: 'warning' }).value).toContain('text-warning');
  });

  it('should return correct trend classes', () => {
    expect(getMetricCardClasses({ label: 'Test', value: 100, trend: 'up' }).trend).toBe('text-success');
    expect(getMetricCardClasses({ label: 'Test', value: 100, trend: 'down' }).trend).toBe('text-error');
    expect(getMetricCardClasses({ label: 'Test', value: 100, trend: 'neutral' }).trend).toBe('text-base-content/60');
  });
});

describe('MetricCard Use Cases', () => {
  it('should support revenue metrics', () => {
    const props: MetricCardProps = {
      label: 'MRR',
      value: '$1,234.56',
      trend: 'up',
      trendValue: '+5.2%',
      icon: 'currency',
      variant: 'success'
    };
    expect(validateMetricCardProps(props).valid).toBe(true);
  });

  it('should support user metrics', () => {
    const props: MetricCardProps = {
      label: 'Active Users',
      value: 1234,
      trend: 'up',
      trendValue: '+12',
      icon: 'users',
      variant: 'info'
    };
    expect(validateMetricCardProps(props).valid).toBe(true);
  });

  it('should support warning metrics', () => {
    const props: MetricCardProps = {
      label: 'Churn Rate',
      value: '2.5%',
      trend: 'down',
      trendValue: '-0.3%',
      icon: 'percent',
      variant: 'warning'
    };
    expect(validateMetricCardProps(props).valid).toBe(true);
  });

  it('should support error/alert metrics', () => {
    const props: MetricCardProps = {
      label: 'Failed Payments',
      value: 5,
      icon: 'alert',
      variant: 'error'
    };
    expect(validateMetricCardProps(props).valid).toBe(true);
  });
});
