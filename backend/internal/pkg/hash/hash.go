package hash

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const cost = 12

// Hash returns the bcrypt hash of a plaintext password.
func Hash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(bytes), nil
}

// Compare reports whether plaintext password matches the stored hash.
func Compare(hash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
