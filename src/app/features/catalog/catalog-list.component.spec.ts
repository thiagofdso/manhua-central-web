import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CatalogListComponent } from './catalog-list.component';
import { CatalogService } from '../../core/services/catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { ImportService } from '../../core/services/import.service';
import { CatalogResponse } from '../../core/models/catalog.model';

describe('CatalogListComponent', () => {
  let component: CatalogListComponent;
  let fixture: ComponentFixture<CatalogListComponent>;
  let mockCatalogService: jasmine.SpyObj<CatalogService>;
  let mockImportService: jasmine.SpyObj<ImportService>;

  const mockResponse: CatalogResponse = {
    items: [
      {
        id: 1,
        slug: 'overgeared',
        title: 'Overgeared',
        primaryDomain: 'asurascans.com',
        urlTemplate: 'https://asurascans.com/comics/overgeared/chapter/{chapter}',
        lastChapter: 344,
        isHiatus: false,
        bayesianRating: 9.52,
        totalVotes: 1450,
        totalViews: 280000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        slug: 'almighty-pig',
        title: 'Almighty Pig Slaughtering Knife',
        primaryDomain: 'ravenscans.org',
        urlTemplate: 'https://ravenscans.org/knife-chapter-{chapter}/',
        lastChapter: 66,
        isHiatus: false,
        bayesianRating: 8.70,
        totalVotes: 340,
        totalViews: 78000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    total: 2,
    page: 1,
    pageSize: 20,
    totalPages: 1
  };

  beforeEach(async () => {
    mockCatalogService = jasmine.createSpyObj('CatalogService', ['getCatalog', 'getDomains']);
    mockCatalogService.getCatalog.and.returnValue(of(mockResponse));
    mockCatalogService.getDomains.and.returnValue(of([
      { domain: 'asurascans.com', name: 'Asura Scans' },
      { domain: 'pickmeupgacha.com', name: 'Pick Me Up Gacha' },
      { domain: 'mangafire.to', name: 'MangaFire' }
    ]));

    mockImportService = jasmine.createSpyObj('ImportService', ['getDomains']);
    mockImportService.getDomains.and.returnValue(of([
      { domain: 'all', name: 'Todos (Geral)', supported: true },
      { domain: 'asurascans.com', name: 'Asura Scans', supported: true },
      { domain: 'mangafire.to', name: 'MangaFire', supported: true }
    ]));

    await TestBed.configureTestingModule({
      imports: [CatalogListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CatalogService, useValue: mockCatalogService },
        { provide: ImportService, useValue: mockImportService },
        { provide: AuthService, useValue: { isAuthenticated: () => false, currentUser: signal(null) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load catalog items on init', () => {
    expect(component).toBeTruthy();
    expect(mockCatalogService.getCatalog).toHaveBeenCalled();
    expect(component.manhuas().length).toBe(2);
    expect(component.manhuas()[0].title).toBe('Overgeared');
    expect(mockCatalogService.getDomains).toHaveBeenCalled();
  });

  it('should filter by domain when domain button is clicked', () => {
    component.onDomainChange('mangafire.to');
    expect(component.selectedDomain()).toBe('mangafire.to');
    expect(mockCatalogService.getCatalog).toHaveBeenCalledWith(jasmine.objectContaining({
      domain: 'mangafire.to'
    }));
  });

  it('should filter by status when status select changes', () => {
    component.onStatusChange('active');
    expect(component.selectedStatus()).toBe('active');
    expect(mockCatalogService.getCatalog).toHaveBeenCalledWith(jasmine.objectContaining({
      isHiatus: false
    }));

    component.onStatusChange('hiatus');
    expect(component.selectedStatus()).toBe('hiatus');
    expect(mockCatalogService.getCatalog).toHaveBeenCalledWith(jasmine.objectContaining({
      isHiatus: true
    }));
  });

  it('should update search query and reload catalog', () => {
    component.onSearchInput('pig');
    expect(component.searchQuery()).toBe('pig');
    expect(mockCatalogService.getCatalog).toHaveBeenCalledWith(jasmine.objectContaining({
      query: 'pig'
    }));
  });

  it('should reset all filters and reload catalog', () => {
    component.searchQuery.set('test');
    component.selectedDomain.set('comix.to');
    component.selectedStatus.set('hiatus');

    component.resetFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.selectedDomain()).toBe('');
    expect(component.selectedStatus()).toBe('all');
    expect(mockCatalogService.getCatalog).toHaveBeenCalled();
  });

  it('should toggle import modal state and reload catalog when imported', () => {
    expect(component.showImportModal()).toBeFalse();
    component.openImportModal();
    expect(component.showImportModal()).toBeTrue();

    mockCatalogService.getCatalog.calls.reset();
    component.onImportDialogClosed(true);
    expect(component.showImportModal()).toBeFalse();
    expect(mockCatalogService.getCatalog).toHaveBeenCalled();
  });
});
