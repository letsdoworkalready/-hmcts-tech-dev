module.exports = {
  roots: ['<rootDir>/src/test/unit'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  // List every describe / test name in the terminal (not only file-level PASS).
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
