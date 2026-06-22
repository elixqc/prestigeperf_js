const { buildSystemPrompt } = require('../controllers/chatbot');

describe('buildSystemPrompt', () => {
  const mockProducts = [
    { product_name: 'Noir Élégance', variant: 'EDP 100ml', selling_price: 3200, description: 'Dark floral scent for evenings.' },
    { product_name: 'Acqua Vitale', variant: 'EDT 75ml', selling_price: 1600, description: 'Fresh citrus for daytime.' }
  ];

  test('includes product names in prompt', () => {
    const prompt = buildSystemPrompt(mockProducts);
    expect(prompt).toContain('Noir Élégance');
    expect(prompt).toContain('Acqua Vitale');
  });

  test('includes product prices', () => {
    const prompt = buildSystemPrompt(mockProducts);
    expect(prompt).toContain('3200');
    expect(prompt).toContain('1600');
  });

  test('includes product descriptions', () => {
    const prompt = buildSystemPrompt(mockProducts);
    expect(prompt).toContain('Dark floral scent for evenings.');
  });

  test('returns a string', () => {
    const prompt = buildSystemPrompt(mockProducts);
    expect(typeof prompt).toBe('string');
  });
});