import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ImportDialogComponent } from './import-dialog.component';
import { of } from 'rxjs';
import { ImportService } from '../../core/services/import.service';
import { AuthService } from '../../core/auth/auth.service';

describe('ImportDialogComponent', () => {
  let component: ImportDialogComponent;
  let fixture: ComponentFixture<ImportDialogComponent>;
  let mockImportService: jasmine.SpyObj<ImportService>;
  let mockAuthService: { isAuthenticated: jasmine.Spy };

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj('ImportService', ['getDomains', 'browse', 'importWorks']);
    mockImportService.getDomains.and.returnValue(of([
      { domain: 'asurascans.com', name: 'Asura Scans', supported: true }
    ]));
    mockImportService.browse.and.returnValue(of({
      domain: 'asurascans.com',
      page: 1,
      totalPages: 1,
      items: [
        {
          title: 'Solo Leveling',
          slug: 'solo-leveling',
          urlTemplate: 'https://...',
          coverUrl: 'https://...',
          primaryDomain: 'asurascans.com',
          alreadyInCatalog: false,
          alreadyInLibrary: false
        }
      ]
    }));
    mockImportService.importWorks.and.returnValue(of({
      status: 'success',
      importedCount: 1,
      addedToLibraryCount: 1
    }));

    mockAuthService = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true)
    };

    await TestBed.configureTestingModule({
      imports: [ImportDialogComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: ImportService, useValue: mockImportService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load domains on init', () => {
    expect(component).toBeTruthy();
    expect(mockImportService.getDomains).toHaveBeenCalled();
  });

  it('should toggle selection of items', () => {
    const item = {
      title: 'Solo Leveling',
      slug: 'solo-leveling',
      urlTemplate: 'https://...',
      coverUrl: 'https://...',
      primaryDomain: 'asurascans.com',
      alreadyInCatalog: false,
      alreadyInLibrary: false
    };

    component.toggleSelection(item);
    expect(component.selectedItems().size).toBe(1);

    component.toggleSelection(item);
    expect(component.selectedItems().size).toBe(0);
  });

  it('should emit closed event on close()', () => {
    spyOn(component.closed, 'emit');
    component.close(false);
    expect(component.closed.emit).toHaveBeenCalledWith(false);
  });

  it('should block submitImport if user is not authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);
    const item = {
      title: 'Solo Leveling',
      slug: 'solo-leveling',
      urlTemplate: 'https://...',
      coverUrl: 'https://...',
      primaryDomain: 'asurascans.com',
      alreadyInCatalog: false,
      alreadyInLibrary: false
    };
    component.toggleSelection(item);

    component.submitImport();

    expect(mockImportService.importWorks).not.toHaveBeenCalled();
    expect(component.error()).toContain('É necessário estar conectado');
  });

  it('should call importWorks when authenticated and items selected', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    const item = {
      title: 'Solo Leveling',
      slug: 'solo-leveling',
      urlTemplate: 'https://...',
      coverUrl: 'https://...',
      primaryDomain: 'asurascans.com',
      alreadyInCatalog: false,
      alreadyInLibrary: false
    };
    component.toggleSelection(item);

    spyOn(component.closed, 'emit');
    component.submitImport();

    expect(mockImportService.importWorks).toHaveBeenCalled();
    expect(component.closed.emit).toHaveBeenCalledWith(true);
  });
});
