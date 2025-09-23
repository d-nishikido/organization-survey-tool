import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('displays correct progress information', () => {
    render(<ProgressBar current={3} total={10} />);
    
    expect(screen.getByText('質問 3 / 10')).toBeInTheDocument();
    expect(screen.getByText('30% 完了')).toBeInTheDocument();
  });

  it('shows completion status when completed', () => {
    render(<ProgressBar current={10} total={10} />);
    
    expect(screen.getByText('質問 10 / 10')).toBeInTheDocument();
    expect(screen.getByText('100% 完了')).toBeInTheDocument();
    expect(screen.getByText('すべての質問が完了しました')).toBeInTheDocument();
  });

  it('hides numbers when showNumbers is false', () => {
    render(<ProgressBar current={3} total={10} showNumbers={false} />);
    
    expect(screen.queryByText('質問 3 / 10')).not.toBeInTheDocument();
    expect(screen.getByText('30% 完了')).toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<ProgressBar current={3} total={10} showPercentage={false} />);
    
    expect(screen.getByText('質問 3 / 10')).toBeInTheDocument();
    expect(screen.queryByText('30% 完了')).not.toBeInTheDocument();
  });
});