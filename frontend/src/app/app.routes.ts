import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/projects',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./projects/project-list/project-list.component').then(m => m.ProjectListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'issues',
    loadComponent: () => import('./issues/issue-list/issue-list.component').then(m => m.IssueListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'issues/:id',
    loadComponent: () => import('./issues/issue-detail/issue-detail.component').then(m => m.IssueDetailComponent),
    canActivate: [authGuard]
  }
];
