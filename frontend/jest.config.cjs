module.exports = {
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/*.test.cjs"],
    transform: {
        "^.+\\.ts$": "<rootDir>/jest.transformer.cjs"
    },
    clearMocks: true
};
