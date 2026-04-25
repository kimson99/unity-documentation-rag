import { type RouteConfig, layout, route } from '@react-router/dev/routes';

export default [
  layout('app/layouts/main-layout.tsx', [
    route('/', './pages/home.tsx', { index: true }),
    route('/chat', './pages/chat.tsx'),
    route('/indexing', './pages/indexing.tsx'),
    route('/indexing/:documentIndexingId', './pages/indexing-detail.tsx'),
  ]),
  route('/about', './pages/about.tsx'),
  route('/login', './pages/login.tsx'),
  route('/signup', './pages/signup.tsx'),
  route('*?', 'catchall.tsx'),
] satisfies RouteConfig;
