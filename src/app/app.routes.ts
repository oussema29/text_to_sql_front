import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { ShellComponent } from './layout/shell.component';
import { QueryWorkspaceComponent } from './features/query-workspace/query-workspace.component';
import { TableListComponent } from './features/schema-explorer/table-list.component';
import { TableDetailComponent } from './features/schema-explorer/table-detail.component';
import { AuditLogComponent } from './features/audit-log/audit-log.component';
import { DocumentListComponent } from './features/schema-metadata/document-list.component';
import { DocumentEditorComponent } from './features/schema-metadata/document-editor.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: QueryWorkspaceComponent },
      { path: 'schema', component: TableListComponent },
      { path: 'schema/:name', component: TableDetailComponent },
      { path: 'audit', component: AuditLogComponent },
      {
        path: 'metadata',
        component: DocumentListComponent,
        canActivate: [adminGuard]
      },
      {
        path: 'metadata/:id',
        component: DocumentEditorComponent,
        canActivate: [adminGuard]
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
