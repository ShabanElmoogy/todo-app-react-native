import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTodos = query({
  handler: async (ctx) => {
    const todos = await ctx.db.query("todos").order("desc").collect();
    return todos;
  },
});

//add todo from mutation
export const addTodo = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const todoId = await ctx.db.insert("todos", {
      text: args.text,
      isCompleted: false,
    });
    return todoId;
  },
});

//toggle status
export const toggleTodo = mutation({
  //get todo id
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    //check if todo exists
    if (!todo) throw new ConvexError("Todo not found");
    await ctx.db.patch(args.id, { isCompleted: !todo.isCompleted });
  },
});

//delete todo
export const deleteTodo = mutation({
  //get todo id
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    //check if todo exists
    if (!todo) throw new ConvexError("Todo not found");
    await ctx.db.delete(args.id);
  },
});

//update todo
export const updateTodo = mutation({
  //get todo id
  args: { id: v.id("todos"), text: v.string() },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.id);
    //check if todo exists
    if (!todo) throw new ConvexError("Todo not found");
    await ctx.db.patch(args.id, { text: args.text });
  },
});

//Delete All
export const deleteAll = mutation({
  handler: async (ctx) => {
    const todo = await ctx.db.query("todos").collect();

    //Delete all todos - foreach
    todo.forEach(async (todo) => {
      await ctx.db.delete(todo._id);
    });

    return { deletedCount: todo.length };
  },
});
