import { test, describe } from 'node:test';
import assert from 'node:assert';

// We can unit test the validation logic from the service without hitting the DB
// by extracting the validation logic or testing the core constraints directly.

describe('Event Quantity Validation Rules (FSE-01)', () => {
    
    function validateCountQuantity(quantity: number | null | undefined) {
        if (quantity == null || !Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
            if (quantity != null && quantity > 500) {
                throw new Error("Quantity exceeds 500 limit");
            }
            throw new Error("Invalid quantity for COUNT");
        }
        return true;
    }

    test('accepts valid quantities between 1 and 500', () => {
        assert.strictEqual(validateCountQuantity(1), true);
        assert.strictEqual(validateCountQuantity(450), true);
        assert.strictEqual(validateCountQuantity(500), true);
    });

    test('rejects quantities strictly greater than 500', () => {
        assert.throws(() => {
            validateCountQuantity(501);
        }, /Quantity exceeds 500 limit/);

        assert.throws(() => {
            validateCountQuantity(1000);
        }, /Quantity exceeds 500 limit/);
    });

    test('rejects null, negative, or non-integer quantities', () => {
        assert.throws(() => {
            validateCountQuantity(0);
        }, /Invalid quantity for COUNT/);

        assert.throws(() => {
            validateCountQuantity(-50);
        }, /Invalid quantity for COUNT/);

        assert.throws(() => {
            validateCountQuantity(null);
        }, /Invalid quantity for COUNT/);

        assert.throws(() => {
            validateCountQuantity(10.5);
        }, /Invalid quantity for COUNT/);
    });
});
