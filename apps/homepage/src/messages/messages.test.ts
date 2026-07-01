import en from './en.json';
import ptBR from './pt-BR.json';

describe('homepage messages', () => {
  it('keeps the home title available in every locale', () => {
    expect(en.home.title).toBe('Tellery');
    expect(ptBR.home.title).toBe('Tellery');
  });
});
