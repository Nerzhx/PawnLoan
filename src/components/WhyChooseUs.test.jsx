import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WhyChooseUs from './WhyChooseUs';

describe('WhyChooseUs Component', () => {
  it('renders the main heading', () => {
    render(<WhyChooseUs />);
    expect(screen.getByText(/Why choose PawnLoan\?/i)).toBeInTheDocument();
  });

  it('renders the correct number of feature cards', () => {
    render(<WhyChooseUs />);
    // Verify all 4 feature cards are present by checking their titles
    expect(screen.getByText(/Blockchain Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/Real-Time Impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete Transparency/i)).toBeInTheDocument();
    expect(screen.getByText(/Low Fees/i)).toBeInTheDocument();
  });
});
