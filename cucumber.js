module.exports = {
    default: {
        requireModule: ['ts-node/register'],
        require: [
            'examples/sample-test-suite/step-definitions/example_login.steps.ts',
            'examples/sample-test-suite/step-definitions/pricefox_navigation.steps.ts'
        ],
        format: ['progress'],
        formatOptions: { snippetInterface: 'async-await' },
        timeout: 60000 // 60 seconds timeout for each step
    }
};
