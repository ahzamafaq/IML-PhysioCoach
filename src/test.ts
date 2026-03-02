console.log('🏥 Step 1: Starting Marcelle Minimal Test');

import '@marcellejs/core/dist/marcelle.css';
import { dashboard, text } from '@marcellejs/core';

console.log('🏥 Step 2: Imports successful');

const dash = dashboard({
    title: '🏥 Physiotherapy Coach',
    author: 'IML Course',
});

console.log('🏥 Step 3: Dashboard created');

const greeting = text('## Welcome! The application is loading...');

console.log('🏥 Step 4: Text component created');

dash.page('Home').use(greeting);

console.log('🏥 Step 5: Page configured');

dash.show();

console.log('🏥 Step 6: Dashboard shown! ✅');
