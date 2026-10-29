import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImportDialogComponent } from './import-dialog.component';
import { of } from 'rxjs';
import { ImportService } from '../../core/services/import.service';

describe('ImportDialogComponent', () => {
  let component: ImportDialogComponent;
  let fixture: ComponentFixture<ImportDialogComponent>;
  let mockImportService: jasmine.SpyObj<ImportService>;

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

    await TestBed.configureTestingModule({
      imports: [ImportDialogComponent, HttpClientTestingModule],
      providers: [
        { provide: ImportService, useValue: mockImportService }
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
});
