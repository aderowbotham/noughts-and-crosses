# noughts-and-crosses

### version 1.1

Uses Foundation and AngularJS
use `npm install` to install dependencies


-----


This is a machine learning experiment inspired by [Matthew Scroggs version of MENACE](https://www.mscroggs.co.uk/menace/) which I found via one of [Matt Parker's videos](https://www.youtube.com/watch?v=R9c-_neaxeU), after MENACE was featured in the 2019 RI Christmas lectures.

The computer player stores the moves it makes against the board configurations, and at the end of each game we then reward or penalise each of those moves depending on the outcome of the game. All game history states are recorded in local storage so that the computer player learns over time.

It has many limitations but was super interesting and fun to build!



### Notes

- Originally we were rewarding or penalising all moves equally at the end of the game. But then when studying Matthew's [notes for MENACE](https://www.mscroggs.co.uk/blog/19) I saw that we should provide fewer starting chances per position for each move we advance through each game. i.e. 4 chances for the 1st move, 3 chances for the 2nd move, 2 chances fo the 3rd move etc. As Matthew notes in the blog post *This helps MENACE learn more quickly, as the later moves are more likely to have led to the loss"*. This has much improved the situation desribed in the next (now-crossed out) bullet point.

- ~~Because all moves in a losing game are penalised this can often lead to the first move - even if it is the best move (i.e. the centre) - ending up in the state where all weightings for that board state are zero. In this case we reset just that state by re-seeding it as if it were the first game again. However this slows down learning further as it has to "learn" that going in the centre is the best move again. An alternative could be to re-seed this state with just a weighting of 1 for each position, which could at least speed up the process of discovering the best move again (although I'm not sure if this would be better)~~
- When testing this you tend to become a formidable noughts-and-crosses player, thus you don't tend to make lots of mistakes. The effect of this is that the computer doesn't learn the value of an open goal (simply as they are rarely presented to it). Perhaps playing against lots of different people with different abilities would help.
- To fix the above we could fairly easily build in a pattern recognition system - i.e. so it could find lines of two that just need one more move to complete them. This would make the computer always take that move if available, but this would no longer be a pure reinforcement learning system so perhaps defeats the object.
- It would make sense for the computer to also learn from the human opponent. This could use the same logic except it would only need to record opponent states and then save or update its own history based on these. However - would these states be any use? They are impossible to get into because the human player goes second. Perhaps by switching the pieces and using rotations and reflections it could "learn" from them? Needs some experimentation.
- ~~The Computer player doesn't currently check for rotated or reflected boards in its history so learning is slow~~ - done!


### To-do

- ~~Save state in browser local storage for persistence, and add a hard reset button.~~
- ~~Check for rotations and reflections in state history~~
- ~~(possibly) Add option to save state on the server with unique URL, for sharing / recall (would require API and database setup, possibly not worth it)~~
