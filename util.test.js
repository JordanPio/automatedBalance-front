// get the functions in here import them

// const { } = require(' ./place where ur function is')

// es6 export is not supported natively by jest

test('should output name and age', () => {
    const text = yourImportedFunction('Max', 29)
    expect(text).toBe('Max (29 years old)')
    // you can run 2 tests in one to avoid false positives
    const text2 = yourImportedFunction('Anna', 28)
    expect(text2).toBe('Anna (28 years old)')
});

teste('should output data-less text', () => {
    const text = generateText('', null)
    expect(text).toBe(' ( null years old)')
})