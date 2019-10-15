import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

const state = {};

// search controller
const controlSearch = async () => {
    const query = searchView.getInput();

    if (query) {
        state.search = new Search(query);
        
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            await state.search.getResults();

            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {  
            alert('Exceeded recipe search limit, try back soon!')
            clearLoader();
        }
        
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

/* elements.searchForm.addEventListener('load', e => {
    e.preventDefault();
    controlSearch();
});
*/

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});


//Recipe Controller
const controlRecipe = async () => {
    //get id from url
    const id = window.location.hash.replace('#', '');

    if (id) {
        //prep UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        if (state.search) searchView.highlightSelected(id);

        state.recipe = new Recipe(id);
        
        try {
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            state.recipe.calcTime();
            state.recipe.calcServings()

            //render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                
            );

        } catch (err) {
            console.log(err);
            alert('Error processing recipe.');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


//List Controller

const controlList = () => {
    //create new if none
    if (!state.list) state.list = new List();

    //add ingredients to list and ui
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

// handle delete and update item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);
    
    //handle count update
    } else if (e.target.matches('.shopping__count-value')) {

        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

//Like Controller
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        //add like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //toggle like button
        likesView.toggleLikeBtn(true);
        
        // add like to UI list  
        likesView.renderLike(newLike);

    //user has liked current recipe
    } else {
        //remove like to state
        state.likes.deleteLike(currentID);
        //toggle like button
        likesView.toggleLikeBtn(false);
        //remove like to UI list  
        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore Liked Recipes on page Load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //restore likes
    state.likes.readStorage();

    //toggle like menu buttons
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});





//handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        //decrease button is 
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like Controller
        controlLike();
    }

});