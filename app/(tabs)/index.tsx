import { createHomeStyles } from "@/assets/styles/home.styles";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import TodoInput from "@/components/TodoInput";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";

type Todo = Doc<"todos">;

type FilterType = "all" | "active" | "completed";

export default function Index() {
  const { colors } = useTheme();

  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const flatListRef = useRef<FlatList>(null);

  const homeStyles = createHomeStyles(colors);
  const todos = useQuery(api.todos.getTodos);
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const updateTodo = useMutation(api.todos.updateTodo);

  const isLoading = todos === undefined;

  // Filter todos based on current filter
  const filteredTodos =
    todos?.filter((todo) => {
      switch (filter) {
        case "active":
          return !todo.isCompleted;
        case "completed":
          return todo.isCompleted;
        default:
          return true;
      }
    }) || [];

  const handleToggleTodo = async (id: Id<"todos">) => {
    try {
      await toggleTodo({ id });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error toggling todo");
    }
  };

  const handleDeleteTodo = async (id: Id<"todos">) => {
    try {
      Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            await deleteTodo({ id });
          },
          style: "destructive",
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error deleting todo");
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo._id);
    setEditText(todo.text);

    // Scroll to the editing item after a short delay to ensure the edit mode is rendered
    setTimeout(() => {
      if (filteredTodos && flatListRef.current) {
        const index = filteredTodos.findIndex((item) => item._id === todo._id);
        if (index !== -1) {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0, // Position the item at the very top of the screen
          });
        }
      }
    }, 100);
  };

  const handleSaveTodo = async () => {
    if (editingId) {
      try {
        await updateTodo({ id: editingId, text: editText });
        setEditingId(null);
        setEditText("");
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Error updating todo");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  if (isLoading) return <LoadingSpinner />;

  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      onPress={() => setFilter(filterType)}
      activeOpacity={0.8}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={
          filter === filterType
            ? colors.gradients.primary
            : colors.gradients.muted
        }
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const isEditing = item._id === editingId;
    return (
      <View style={homeStyles.todoItemWrapper}>
        <LinearGradient
          colors={colors.gradients.surface}
          style={homeStyles.todoItem}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Checkbox Toggle */}
          <TouchableOpacity
            style={homeStyles.checkbox}
            activeOpacity={0.7}
            onPress={() => handleToggleTodo(item._id)}
          >
            <LinearGradient
              colors={
                item.isCompleted
                  ? colors.gradients.success
                  : colors.gradients.muted
              }
              style={[
                homeStyles.checkboxInner,
                {
                  borderColor: item.isCompleted ? "transparent" : colors.border,
                },
              ]}
            >
              {item.isCompleted && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Todo Text and Actions */}
          {isEditing ? (
            <View style={homeStyles.editContainer}>
              <TextInput
                style={homeStyles.editInput}
                value={editText}
                onChangeText={setEditText}
                autoFocus
                multiline
                placeholder="Enter todo todo ... "
                placeholderTextColor={colors.textMuted}
              />
              <View style={homeStyles.editButtons}>
                <TouchableOpacity onPress={handleSaveTodo} activeOpacity={0.8}>
                  <LinearGradient
                    colors={colors.gradients.success}
                    style={homeStyles.editButton}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={homeStyles.editButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancelEdit}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.muted}
                    style={homeStyles.editButton}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={homeStyles.editButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={homeStyles.todoTextContainer}>
              <Text
                style={[
                  homeStyles.todoText,
                  item.isCompleted && {
                    textDecorationLine: "line-through",
                    color: colors.textMuted,
                    opacity: 0.7,
                  },
                ]}
              >
                {item.text}
              </Text>

              <View style={homeStyles.todoActions}>
                <TouchableOpacity
                  onPress={() => handleEditTodo(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.warning}
                    style={homeStyles.actionButton}
                  >
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    handleDeleteTodo(item._id);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.danger}
                    style={homeStyles.actionButton}
                  >
                    <Ionicons name="trash" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={homeStyles.container}
    >
      <StatusBar
        backgroundColor={
          Platform.OS === "android" ? colors.statusBarStyle : "transparent"
        }
        barStyle={Platform.OS === "ios" ? colors.statusBarStyle : "default"}
        translucent={false}
      />
      <SafeAreaView style={homeStyles.safeArea}>
        <Header />
        <TodoInput />

        {/* Filter Buttons - Hide when editing */}
        {!editingId && (
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 24,
              paddingBottom: 16,
              gap: 12,
            }}
          >
            {renderFilterButton("all", "All")}
            {renderFilterButton("active", "Active")}
            {renderFilterButton("completed", "Completed")}
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <FlatList
            ref={flatListRef}
            data={filteredTodos}
            renderItem={renderTodoItem}
            keyExtractor={(item) => item._id}
            style={homeStyles.todoList}
            contentContainerStyle={[
              homeStyles.todoListContent,
              {
                paddingBottom: editingId ? 300 : 20, // Add extra padding when editing to ensure buttons are visible
              },
            ]}
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollToIndexFailed={(info) => {
              // Handle scroll to index failure gracefully
              const wait = new Promise((resolve) => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0,
                });
              });
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
