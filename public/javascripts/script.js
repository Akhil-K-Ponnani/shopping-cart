function addToCart(productId)
{
   $.ajax({
      url:'/add-to-cart/'+productId,
      method:'get',
      success:(response) => {
         if(response.status)
         {
            let count = $('#cart-count').html()
            count = parseInt(count)+1
            $('#cart-count').html(count)
         }
      }
   })
};







function buyNow(productId)
{
   $.ajax({
      url:'/add-to-cart/'+productId,
      method:'get',
      success:(response) => {
         if(response.status)
         {
            let count = $('#cart-count').html()
            count = parseInt(count)+1
            $('#cart-count').html(count)
            location.href="/place-order?search="+productId
         }
      }
   })
};




//Jquery Validations

$(document).ready(function()
{
  $("#login").validate(
  {
    rules:
    {
      email:
      {
        required:true,
        email:true
      },
      password:
      {
        required:true,
      }
    },
    messages:
    {
      email:"<small class='text-danger'>Please enter a valid Email.</small>",
      password:"<small class='text-danger'>Please enter your Password.</small>"
    }
  })
 
  $("#signup").validate(
  {
    rules:
    {
      name:
      {
        required:true
      },
      email:
      {
        required:true,
        email:true
      },
      password:
      {
        required:true,
        minlength:8,
        maxlength:15
      }
    },
    messages:
    {
      name:"<small class='text-danger'>Please enter your Name.</small>",
      email:"<small class='text-danger'>Please enter a valid Email.</small>",
      password:"<small class='text-danger'>Password must be 8-15 characters.</small>"
    }
  })
 
  $("#add-product").validate(
  {
    rules:
    {
      name:
      {
        required:true
      },
      category:
      {
        required:true
      },
      variant:
      {
         required:true
      },
      price:
      {
        required:true,
        number:true
      },
      description:
      {
        required:true
      },
      image:
      {
        required:true
      }
    },
    messages:
    {
      name:"<small class='text-danger'>Please enter a product Name.</small>",
      category:"<small class='text-danger'>Please choose a product Category.</small>",
      variant:"<small class='text-danger'>Please enter a product Variant.</small>",
      price:"<small class='text-danger'>Please enter a valid product Price.</small>",
      description:"<small class='text-danger'>Please enter a product Description.</small>",
      image:"<small class='text-danger'>Please choose a product Image.</small>"
    }
  })
 
  $("#edit-product").validate(
  {
    rules:
    {
      name:
      {
        required:true
      },
      category:
      {
        required:true
      },
      variant:
      {
         required:true
      },
      price:
      {
        required:true,
        number:true
      },
      description:
      {
        required:true
      }
    },
    messages:
    {
      name:"<small class='text-danger'>Please enter a product Name.</small>",
      category:"<small class='text-danger'>Please choose a product Category.</small>",
      variant:"<small class='text-danger'>Please enter a product Variant.</small>",
      price:"<small class='text-danger'>Please enter a valid product Price.</small>",
      description:"<small class='text-danger'>Please enter a product Description.</small>"
    }
  })
 
  $("#add-category").validate(
  {
    rules:
    {
      name:
      {
        required:true
      },
      displayName:
      {
        required:true
      },
      image:
      {
        required:true
      }
    },
    messages:
    {
      name:"<small class='text-danger'>Please enter a category Name.</small>",
      displayName:"<small class='text-danger'>Please enter a category display Name.</small>",
      image:"<small class='text-danger'>Please choose a category Image.</small>"
    }
  })
 
  $("#edit-category").validate(
  {
    rules:
    {
      name:
      {
        required:true
      },
      displayName:
      {
        required:true
      }
    },
    messages:
    {
      name:"<small class='text-danger'>Please enter a category Name.</small>",
      displayName:"<small class='text-danger'>Please enter a category display Name.</small>"
    }
  })
})