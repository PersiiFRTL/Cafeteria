module.exports = {
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/*.test.cjs"],
    transform: {
        "^.+\\.ts$": "<rootDir>/jest.transformer.cjs"
    },
    clearMocks: true,
    collectCoverageFrom: [
        "src/domain/operacionesCafeteria.ts",
        "src/services/autenticacion.ts",
        "!**/*.test.*"
    ],
    coverageDirectory: "<rootDir>/coverage",
    coverageReporters: ["text", "html", "lcov"]
};
