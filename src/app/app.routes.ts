import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { ProfileComponent } from './features/profile/profile.component';
import { CatalogListComponent } from './features/catalog/catalog-list.component';
import { CatalogDetailComponent } from './features/catalog/catalog-detail.component';
import { LibraryComponent } from './features/library/library.component';
import { ReaderComponent } from './features/reader/reader.component';
import { RankingsComponent } from './features/rankings/rankings.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'catalog', pathMatch: 'full' },
  { path: 'catalog', component: CatalogListComponent },
  { path: 'catalog/:slug', component: CatalogDetailComponent },
  { path: 'rankings', component: RankingsComponent },
  { path: 'reader/:slug/:chapter', component: ReaderComponent },
  { path: 'library', component: LibraryComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'catalog' }
];
