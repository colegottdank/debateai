import { describe, it, expect } from 'vitest';
import { calculateNewState } from '../src/lib/mechanics';

describe('Mechanics', () => {
  it('should increase combo on long message', () => {
    const longMsg = "This is a very long message that definitely has more than ten words in it so it should count.";
    const { newCombo } = calculateNewState(longMsg, 0, 'neutral');
    expect(newCombo).toBe(1);
  });

  it('should reset combo on short message', () => {
    const shortMsg = "Too short.";
    const { newCombo } = calculateNewState(shortMsg, 5, 'neutral');
    expect(newCombo).toBe(0);
  });

  it('should change mood to impressed on very long message', () => {
    const veryLongMsg = "This message is extremely long and detailed and thoughtful and it goes on and on and on and on and has many many words over thirty words for sure. It really needs to be very long indeed.";
    const { newMood } = calculateNewState(veryLongMsg, 0, 'neutral');
    expect(newMood).toBe('impressed');
  });

  it('should change mood to angry on very short message', () => {
    const shortMsg = "Bad.";
    const { newMood } = calculateNewState(shortMsg, 0, 'neutral');
    expect(newMood).toBe('angry');
  });
});
