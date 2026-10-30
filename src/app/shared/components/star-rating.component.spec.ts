import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with 5 stars', () => {
    expect(component).toBeTruthy();
    const starButtons = fixture.nativeElement.querySelectorAll('button[data-star]');
    expect(starButtons.length).toBe(5);
  });

  it('should emit rating on star click when interactive', () => {
    spyOn(component.rate, 'emit');

    const star3 = fixture.nativeElement.querySelector('button[data-star="3"]');
    star3.click();

    expect(component.rate.emit).toHaveBeenCalledWith(3);
  });

  it('should update hover state on mouse enter and leave', () => {
    component.onMouseEnter(4);
    expect(component.hoverScore()).toBe(4);

    component.onMouseLeave();
    expect(component.hoverScore()).toBe(0);
  });

  it('should display numeric score and total votes count', () => {
    fixture.componentRef.setInput('rating', 4.85);
    fixture.componentRef.setInput('totalVotes', 120);
    fixture.detectChanges();

    const scoreText = fixture.nativeElement.textContent;
    expect(scoreText).toContain('4.85');
    expect(scoreText).toContain('(120)');
  });
});
