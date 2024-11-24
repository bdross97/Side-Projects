import streamlit as st
import pandas as pd
import os

# File paths
stats_file = '/Users/Brayd/Desktop/Data Science Projects/Golf Stats/golf_stats.xlsx'
course_file = '/Users/Brayd/Desktop/Data Science Projects/Golf Stats/course_data.xlsx'
bag_file = '/Users/Brayd/Desktop/Data Science Projects/Golf Stats/golf_bag.xlsx'

# Ensure directories and files exist
os.makedirs(os.path.dirname(stats_file), exist_ok=True)
if not os.path.exists(stats_file):
    pd.DataFrame(columns=[
        "Date", "Course Name", "Hole", "Par", "Yardage", "Handicap", "Tee Club",
        "Fairway Hit", "Approach Club", "Green Status", "Putts",
        "Penalties", "Bunker Type", "Score", "Distance to Green", "Second Approach Club",
        "Second Distance to Green"
    ]).to_excel(stats_file, index=False, engine="openpyxl")

if not os.path.exists(course_file):
    pd.DataFrame(columns=["Course Name", "Hole", "Par", "Yardage", "Handicap"]).to_excel(course_file, index=False, engine="openpyxl")

if not os.path.exists(bag_file):
    pd.DataFrame(columns=["Club Name", "Type"]).to_excel(bag_file, index=False, engine="openpyxl")

# Load data
stats_data = pd.read_excel(stats_file, engine="openpyxl")
course_data = pd.read_excel(course_file, engine="openpyxl")
bag_data = pd.read_excel(bag_file, engine="openpyxl")

# Helper: Save golf bag data
def save_bag_data(data):
    pd.DataFrame(data).to_excel(bag_file, index=False, engine="openpyxl")

# Helper: Save stats data
def save_stats_data(data):
    pd.DataFrame(data).to_excel(stats_file, index=False, engine="openpyxl")

# Helper: Save course data
def save_course_data(data):
    pd.DataFrame(data).to_excel(course_file, index=False, engine="openpyxl")

# Streamlit tabs
tab_options = st.tabs(["Round Details", "Hole Entry", "Golf Bag", "Insights"])

# Tab: Round Details
with tab_options[0]:
    st.header("Round Details")
    date = st.date_input("Date of Round")
    course_name = st.selectbox("Select Course", options=course_data["Course Name"].unique().tolist() + ["Add New Course"])
    is_new_course = course_name == "Add New Course"

    if is_new_course:
        new_course_name = st.text_input("New Course Name")
        course_name = new_course_name

# Hole-by-Hole Entry Tab
with tab_options[1]:
    st.header("Hole-by-Hole Entry")

    if course_name == "Add New Course":
        st.warning("Finish entering course details in the Round Details tab.")
    elif bag_data.empty:
        st.warning("Add clubs to your golf bag in the 'Golf Bag' tab before proceeding!")
    else:
        # Reload course data
        try:
            course_data = pd.read_excel(course_file, engine="openpyxl")
        except Exception as e:
            st.error(f"Error loading course data: {e}")
            course_data = pd.DataFrame(columns=["Course Name", "Hole", "Par", "Yardage", "Handicap"])

        # Get hole index
        hole_index = st.number_input("Current Hole", min_value=1, max_value=18, step=1) - 1

        # Check if hole data exists for the current hole
        hole_data = course_data[(course_data["Course Name"] == course_name) & (course_data["Hole"] == hole_index + 1)]

        if hole_data.empty:
            st.warning(f"No data found for Hole {hole_index + 1} in {course_name}. Please add details.")
            # Input missing hole details
            par = st.selectbox(f"Par for Hole {hole_index + 1}", options=[3, 4, 5], key=f"par_{hole_index + 1}")
            yardage = st.number_input(f"Yardage for Hole {hole_index + 1}", min_value=1, step=1, key=f"yardage_{hole_index + 1}")
            handicap = st.number_input(f"Handicap for Hole {hole_index + 1}", min_value=1, max_value=18, step=1, key=f"handicap_{hole_index + 1}")

            # Save new hole data
            if st.button(f"Save Details for Hole {hole_index + 1}"):
                new_entry = {"Course Name": course_name, "Hole": hole_index + 1, "Par": par, "Yardage": yardage, "Handicap": handicap}
                course_data = pd.concat([course_data, pd.DataFrame([new_entry])], ignore_index=True)
                try:
                    course_data.to_excel(course_file, index=False, engine="openpyxl")
                    st.success(f"Details for Hole {hole_index + 1} saved!")
                except Exception as e:
                    st.error(f"Error saving course data: {e}")
        else:
            # Load existing hole details
            par = hole_data.iloc[0]["Par"]
            yardage = hole_data.iloc[0]["Yardage"]
            handicap = hole_data.iloc[0]["Handicap"]

        # Display stats questions for the hole
        st.subheader(f"Stats for Hole {hole_index + 1}")
        st.write(f"Par: {par}, Yardage: {yardage}, Handicap: {handicap}")

        # Tee club (always asked)
        tee_club = st.selectbox("Tee Club", options=bag_data["Club Name"].tolist(), key=f"tee_club_{hole_index + 1}")

        # Hole-specific questions
        if par == 3:
            # Par 3: Only tee club and green-related stats
            st.write("Par 3: No fairway questions required.")
            green_status = st.radio("Green Status", options=["Hit", "Missed Left", "Missed Right", "Missed Short", "Missed Long"], horizontal=True)
        else:
            # Par 4 and Par 5: Fairway and approach questions
            fairway_hit = st.radio("Fairway Status", options=["Hit", "Missed Left", "Missed Right", "Missed Short"], horizontal=True)

            # Approach stats
            distance_to_green = st.number_input(f"Distance to Green for Hole {hole_index + 1}", min_value=1, step=1, key=f"distance_{hole_index + 1}")
            green_status = st.radio("Green Status", options=["Hit", "Missed Left", "Missed Right", "Missed Short", "Missed Long"], horizontal=True)

            # Additional approach club for par 5 holes
            if par == 5:
                hit_green_in_two = st.radio("Did you hit the green under regulation?", options=["Yes", "No"], key=f"green_in_two_{hole_index + 1}")
                if hit_green_in_two == "No":
                    approach_club_1 = st.selectbox("First Approach Club", options=bag_data["Club Name"].tolist(), key=f"approach_1_{hole_index + 1}")
                    distance_approach_1 = st.number_input("Distance for First Approach", min_value=1, step=1, key=f"distance_approach_1_{hole_index + 1}")
                    approach_club_2 = st.selectbox("Second Approach Club", options=bag_data["Club Name"].tolist(), key=f"approach_2_{hole_index + 1}")
                    distance_approach_2 = st.number_input("Distance for Second Approach", min_value=1, step=1, key=f"distance_approach_2_{hole_index + 1}")

        # Common stats for all holes
        putts = st.number_input("Putts", min_value=0, max_value=10, step=1, key=f"putts_{hole_index + 1}")
        penalties = st.number_input("Penalties", min_value=0, step=1, key=f"penalties_{hole_index + 1}")
        bunker_type = st.selectbox("Bunker Shots", options=["None", "Fairway Bunker", "Greenside Bunker"], key=f"bunker_{hole_index + 1}")
        score = st.number_input("Score", min_value=1, step=1, key=f"score_{hole_index + 1}")

        # Save hole stats
        if st.button("Save Hole Data"):
            hole_stats = {
                "Date": date,
                "Course Name": course_name,
                "Hole": hole_index + 1,
                "Par": par,
                "Yardage": yardage,
                "Handicap": handicap,
                "Tee Club": tee_club,
                "Fairway Hit": fairway_hit if par != 3 else None,
                "Approach Club": tee_club if par == 3 else approach_club_1 if par == 5 else None,
                "Second Approach Club": approach_club_2 if par == 5 else None,
                "Distance to Green": distance_to_green,
                "Green Status": green_status,
                "Putts": putts,
                "Penalties": penalties,
                "Bunker Type": bunker_type,
                "Score": score,
            }
            stats_data = stats_data.append(hole_stats, ignore_index=True)
            save_stats_data(stats_data)
            st.success("Hole data saved!")


# Golf Bag Tab
with tab_options[2]:
    st.header("Manage Your Golf Bag")
    st.write("Input the clubs in your bag. These will be used for club selection in other tabs and to generate performance insights.")

    # Reload the golf bag data at the start of this tab
    try:
        bag_data = pd.read_excel(bag_file, engine="openpyxl")
    except Exception as e:
        st.error(f"Error loading golf bag data: {e}")
        bag_data = pd.DataFrame(columns=["Club Name", "Type"])  # Reinitialize if corrupted

    # Add a new club
    new_club = st.text_input("Club Name")
    new_club_type = st.selectbox("Club Type", options=["Driver", "Wood", "Hybrid", "Iron", "Wedge", "Putter"])

    if st.button("Add Club"):
        if new_club.strip():
            new_entry = {"Club Name": new_club.strip(), "Type": new_club_type}
            bag_data = pd.concat([bag_data, pd.DataFrame([new_entry])], ignore_index=True)
            try:
                bag_data.to_excel(bag_file, index=False, engine="openpyxl")
                st.success(f"Added {new_club} to your bag!")
            except Exception as e:
                st.error(f"Error saving golf bag data: {e}")
        else:
            st.warning("Club Name cannot be empty.")

    # Display the golf bag
    st.subheader("Your Golf Bag")
    if not bag_data.empty:
        st.table(bag_data)
    else:
        st.write("No clubs in your bag yet. Add some to get started!")

    # Remove a club
    if not bag_data.empty:
        club_to_delete = st.selectbox("Select a Club to Remove", options=bag_data["Club Name"].tolist())
        if st.button("Remove Selected Club"):
            bag_data = bag_data[bag_data["Club Name"] != club_to_delete]
            bag_data.reset_index(drop=True, inplace=True)  # Ensure clean indexing
            try:
                bag_data.to_excel(bag_file, index=False, engine="openpyxl")
                st.success(f"Removed {club_to_delete} from your bag!")
            except Exception as e:
                st.error(f"Error saving golf bag data: {e}")


# Tab: Insights
with tab_options[3]:
    st.header("Insights")
    st.write("Insights will be implemented here.")
