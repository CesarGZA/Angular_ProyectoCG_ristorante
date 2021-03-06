import { Component, Input, OnInit, ViewChild,Inject} from '@angular/core';
import {Dish} from '../shared/dish';
import {Params, ActivatedRoute} from '@angular/router';
import {DatePipe, Location} from '@angular/common'
import {DishService} from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {Comment} from '../shared/comment';
import { visibility } from '../animations/app.animation';
import { flyInOut, expand } from '../animations/app.animation';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
    },
    animations: [
      flyInOut(),
      visibility(),
      expand()
    ]
  
})

export class DishdetailComponent implements OnInit {
  dish:Dish;
  dishIds: string[];
  prev: string;
  next: string;
  @ViewChild('cform') commentFormDirective
  commentForm: FormGroup;
  commentCreated: Comment; 
  commentView: Comment; 
  errMess:string;
  dishcopy: Dish;
  visibility = 'shown';
  


  formErrors = {
    'comment': '',
    'author': ''
    
  };

  validationMessages = {
    
    'comment': {
      'required':      'Comment is required.',
      'minlength':     'Comment must be at least 2 characters long.'
    },
    'author': {
      'required':      'Author name is required.',
      'minlength':       'Author name must be at least 2 characters long.',
      'maxlength':     'Author name cannot be more than 25 characters long.'
    }
  };

  constructor(private dishservice: DishService, 
    private route: ActivatedRoute,
    private location: Location,
    private cb: FormBuilder,
    @Inject('BaseURL') private BaseURL) {
      
    }

   
  ngOnInit() {
    this.createForm();
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => {this.visibility = 'hidden'; return this.dishservice.getDish(params['id']);}))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; }, errmess => this.errMess = <any>errmess);
  }
  goBack(): void {
    this.location.back();
  }
  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  createForm(): void {
    this.commentForm = this.cb.group({
      rating: ['', [Validators.required] ],
      comment: ['', [Validators.required, Validators.minLength(2)] ],
      author: ['', [Validators.required,Validators.minLength(2), Validators.maxLength(25)] ],
      date: ['']
    });

    this.commentForm.valueChanges
    .subscribe(data => this.onValueChanged(data));
    console.log(this.commentForm.value.comment)
    this.onValueChanged(); // (re)set validation messages now
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
    if(this.commentForm.status === "VALID"){
      this.commentView=this.commentForm.value;
    }
  }

  
  onSubmit() {
    this.commentCreated = this.commentForm.value;
    console.log(this.commentCreated);
    this.commentCreated.date= new Date().toISOString();
    this.dishcopy.comments.push(this.commentCreated);
    this.dishservice.putDish(this.dishcopy)
    .subscribe(dish=>{
      this.dish=dish;
      this.dishcopy=dish;
    },
    errmess=>{this.dish=null; this.dishcopy=null; this.errMess = <any>errmess;});
    this.commentForm.reset({
      rating: 5,
      author: '',
      comment: '',
      date: ''
    });
    this.commentFormDirective.resetForm();
    this.commentView=null
  }
  
}
