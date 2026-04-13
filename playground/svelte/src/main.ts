import { mount } from 'svelte'
import App from './App.svelte'

// Svelte 5 uses mount() — the class constructor API (new App()) is removed in Svelte 5
mount(App, { target: document.getElementById('app')! })
