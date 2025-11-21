import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string>('')
  const username = ref<string>('')
  const zodiac = ref<string>('')
  const isAuthenticated = ref<boolean>(false)

  function setUser(id: string, name: string, zodiacSign: string) {
    userId.value = id
    username.value = name
    zodiac.value = zodiacSign
    isAuthenticated.value = true
  }

  function clearUser() {
    userId.value = ''
    username.value = ''
    zodiac.value = ''
    isAuthenticated.value = false
  }

  return {
    userId,
    username,
    zodiac,
    isAuthenticated,
    setUser,
    clearUser
  }
})
