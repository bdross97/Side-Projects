import streamlit as st
import pandas as pd
import os
import plotly.express as px
import plotly.graph_objects as go
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

        # Initialize default values for fields
        fairway_hit = None
        approach_club_1 = None
        distance_to_green = None
        approach_club_2 = None
        distance_approach_2 = None
        green_status = None  # Ensure this is always defined

        # Hole-specific questions
        if par == 3:
            # Par 3: Only tee club and green-related stats
            st.write("Par 3: No fairway questions required.")
            green_status = st.radio("Green Status", options=["Hit", "Missed Left", "Missed Right", "Missed Short", "Missed Long"], horizontal=True)
        else:
            # Par 4 and Par 5: Fairway and approach questions
            fairway_hit = st.radio("Fairway Status", options=["Hit", "Missed Left", "Missed Right", "Missed Short"], horizontal=True)

            # First approach stats (always relevant for par 4 and par 5)
            approach_club_1 = st.selectbox("Approach Club", options=bag_data["Club Name"].tolist(), key=f"approach_club_{hole_index + 1}")
            distance_to_green = st.number_input(f"Distance to Green for Hole {hole_index + 1}", min_value=1, step=1, key=f"distance_{hole_index + 1}")
            green_status = st.radio("Green Status", options=["Hit", "Missed Left", "Missed Right", "Missed Short", "Missed Long"], horizontal=True)

            # Additional approach club for par 5 holes
            if par == 5:
                hit_green_in_two = st.radio("Did you hit the green under regulation?", options=["Yes", "No"], key=f"green_in_two_{hole_index + 1}")
                if hit_green_in_two == "No":
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
                "Approach Club": approach_club_1,
                "Second Approach Club": approach_club_2,
                "Distance to Green": distance_to_green,
                "Second Distance to Green": distance_approach_2,
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


with tab_options[3]:
    st.header("Insights")

    # Load data
    try:
        stats_data = pd.read_excel(stats_file, engine="openpyxl")
    except Exception as e:
        st.error(f"Error loading stats data: {e}")
        stats_data = pd.DataFrame()  # Initialize empty if file not found

    if stats_data.empty:
        st.write("No data available yet. Play a round and save stats to see insights!")
    else:
        # Filters
        st.subheader("Filters")
        course_filter = st.selectbox("Select Course", options=["All"] + stats_data["Course Name"].unique().tolist())
        date_range = st.date_input("Select Date Range", [])

        # Apply filters
        filtered_data = stats_data.copy()
        if course_filter != "All":
            filtered_data = filtered_data[filtered_data["Course Name"] == course_filter]
        if len(date_range) == 2:  # Apply date range filter
            filtered_data = filtered_data[
                (filtered_data["Date"] >= pd.Timestamp(date_range[0])) &
                (filtered_data["Date"] <= pd.Timestamp(date_range[1]))
            ]

        # Check for required columns
        if "Fairway Hit" in filtered_data.columns and "Par" in filtered_data.columns:
            filtered_data["Fairway Hit (Numeric)"] = filtered_data["Fairway Hit"].apply(lambda x: 1 if x == "Hit" else 0)
            driving_data = filtered_data[filtered_data["Par"] != 3].copy()  # Exclude par-3 holes
        else:
            st.error("Missing required columns ('Fairway Hit' or 'Par') in the data.")
            driving_data = pd.DataFrame()  # Initialize empty DataFrame

        # Driving Accuracy by Club
        st.subheader("Driving Accuracy by Club")
        st.write(
            "This chart shows the overall driving accuracy for each tee club in your bag, sorted in decreasing order. "
            "Accuracy is calculated as the percentage of fairways hit divided by the total tee shots with each club. "
            "Bars are color-graded from green (most accurate) to red (least accurate)."
        )

        if not driving_data.empty:
            club_accuracy = (
                driving_data.groupby("Tee Club")["Fairway Hit (Numeric)"]
                .agg(["sum", "count"])  # Calculate total hits and attempts
                .reset_index()
                .rename(columns={"sum": "Hits", "count": "Attempts"})
            )
            club_accuracy["Accuracy (%)"] = (club_accuracy["Hits"] / club_accuracy["Attempts"]) * 100

            # Sort by accuracy
            club_accuracy = club_accuracy.sort_values(by="Accuracy (%)", ascending=False)

            # Plot total accuracy by club with tooltips showing fractions
            fig_club_total_accuracy = px.bar(
                club_accuracy,
                x="Tee Club",
                y="Accuracy (%)",
                text="Accuracy (%)",
                labels={"Tee Club": "Club", "Accuracy (%)": "Driving Accuracy (%)"},
                title="Overall Driving Accuracy by Club",
                color="Accuracy (%)",
                color_continuous_scale="RdYlGn",
                hover_data={"Hits": True, "Attempts": True}
            )

            fig_club_total_accuracy.update_traces(texttemplate='%{text:.2f}%', textposition='outside')
            fig_club_total_accuracy.update_layout(yaxis=dict(title="Accuracy (%)"), xaxis=dict(title="Club"))
            st.plotly_chart(fig_club_total_accuracy)
        else:
            st.write("No driving data available. Please log some rounds!")

        # Par-4 vs Par-5 Accuracy
        st.subheader("Tee Club Accuracy on Par-4 vs Par-5 Holes")
        st.write(
            "This chart compares the driving accuracy of each tee club on par-4 and par-5 holes. "
            "Use it to identify which clubs perform better on longer holes. The bars are color-coded "
            "using gradients: green to red for par-4 holes and blue to orange for par-5 holes."
        )

        if not driving_data.empty:
            # Group data by club and par type
            par_accuracy = (
                driving_data.groupby(["Tee Club", "Par"])["Fairway Hit (Numeric)"]
                .agg(["sum", "count"])
                .reset_index()
                .rename(columns={"sum": "Hits", "count": "Attempts"})
            )
            par_accuracy["Accuracy (%)"] = (par_accuracy["Hits"] / par_accuracy["Attempts"]) * 100

            # Filter for Par-4 and Par-5 holes only
            par_accuracy = par_accuracy[par_accuracy["Par"].isin([4, 5])]

            # Sort the x-axis in descending order based on overall accuracy
            par_accuracy["Par Label"] = par_accuracy["Par"].map({4: "Par-4", 5: "Par-5"})
            club_order = (
                par_accuracy.groupby("Tee Club")["Accuracy (%)"]
                .mean()
                .sort_values(ascending=False)
                .index
            )
            par_accuracy["Tee Club"] = pd.Categorical(par_accuracy["Tee Club"], categories=club_order, ordered=True)

            # Create color gradients
            par_colors = par_accuracy["Par"].map({4: "RdYlGn", 5: "Bluered"})

            # Plot grouped bar chart for par-4 vs par-5 accuracy with fractions
            fig_par_accuracy = px.bar(
                par_accuracy,
                x="Tee Club",
                y="Accuracy (%)",
                color="Par Label",
                barmode="group",
                text="Accuracy (%)",
                color_discrete_sequence=["green", "red", "blue", "orange"],
                labels={"Tee Club": "Club", "Accuracy (%)": "Accuracy (%)", "Par Label": "Par Type"},
                title="Tee Club Accuracy on Par-4 vs Par-5 Holes",
                hover_data={"Hits": True, "Attempts": True}
            )

            fig_par_accuracy.update_traces(texttemplate='%{text:.2f}%', textposition="outside")
            fig_par_accuracy.update_layout(
                yaxis=dict(title="Accuracy (%)"),
                xaxis=dict(title="Club", categoryorder="array", categoryarray=club_order),
                legend_title="Par Type"
            )
            st.plotly_chart(fig_par_accuracy)
        else:
            st.write("No data available for par-4 and par-5 hole analysis.")


        # Par-4 Tee Club Performance: Hit vs Miss with Scores
        st.subheader("Par-4 Tee Club Performance: Hit vs Miss with Scores")
        st.write(
            "This chart shows your performance on par-4 holes by tee club. Each club has two side-by-side bars: "
            "one for hitting the fairway and one for missing it. The bars are stacked based on the frequency of scores "
            "achieved, color-coded by score."
        )

        if not driving_data.empty:
            # Filter for par-4 data
            par4_data = driving_data[driving_data["Par"] == 4].copy()

            # Group data by Tee Club, Fairway Hit, and Score
            par4_scores = (
                par4_data.groupby(["Tee Club", "Fairway Hit", "Score"])
                .size()
                .reset_index(name="Frequency")
            )

            # Sort Tee Club by overall performance
            club_order_par4 = (
                par4_scores.groupby("Tee Club")["Frequency"]
                .sum()
                .sort_values(ascending=False)
                .index
            )
            par4_scores["Tee Club"] = pd.Categorical(par4_scores["Tee Club"], categories=club_order_par4, ordered=True)

            # Add a Fairway Status label for easier visualization
            par4_scores["Fairway Status"] = par4_scores["Fairway Hit"].map({1: "Hit", 0: "Miss"})

            # Plot stacked side-by-side bars
            fig_par4 = px.bar(
                par4_scores,
                x="Tee Club",
                y="Frequency",
                color="Score",
                barmode="group",
                facet_row="Fairway Status",
                labels={"Fairway Status": "Fairway Status", "Frequency": "Frequency", "Tee Club": "Club"},
                title="Par-4 Performance: Hit vs Miss by Score",
                color_discrete_sequence=px.colors.qualitative.Set3,
                hover_data={"Frequency": True, "Fairway Status": True, "Tee Club": True}
            )

            fig_par4.update_layout(
                yaxis=dict(title="Frequency"),
                xaxis=dict(title="Tee Club"),
                legend_title="Score",
                legend=dict(orientation="h", y=-0.2),
                barmode="group"
            )
            st.plotly_chart(fig_par4)
        else:
            st.write("No data available for par-4 analysis.")


        # Par-5 Tee Club Performance: Hit vs Miss with Scores
        st.subheader("Par-5 Tee Club Performance: Hit vs Miss with Scores")
        st.write(
            "This chart shows your performance on par-5 holes by tee club. Each club has two side-by-side bars: "
            "one for hitting the fairway and one for missing it. The bars are stacked based on the frequency of scores "
            "achieved, color-coded by score."
        )

        if not driving_data.empty:
            # Filter for par-5 data
            par5_data = driving_data[driving_data["Par"] == 5].copy()

            # Group data by Tee Club, Fairway Hit, and Score
            par5_scores = (
                par5_data.groupby(["Tee Club", "Fairway Hit", "Score"])
                .size()
                .reset_index(name="Frequency")
            )

            # Sort Tee Club by overall performance
            club_order_par5 = (
                par5_scores.groupby("Tee Club")["Frequency"]
                .sum()
                .sort_values(ascending=False)
                .index
            )
            par5_scores["Tee Club"] = pd.Categorical(par5_scores["Tee Club"], categories=club_order_par5, ordered=True)

            # Add a Fairway Status label for easier visualization
            par5_scores["Fairway Status"] = par5_scores["Fairway Hit"].map({1: "Hit", 0: "Miss"})

            # Plot stacked side-by-side bars
            fig_par5 = px.bar(
                par5_scores,
                x="Tee Club",
                y="Frequency",
                color="Score",
                barmode="group",
                facet_row="Fairway Status",
                labels={"Fairway Status": "Fairway Status", "Frequency": "Frequency", "Tee Club": "Club"},
                title="Par-5 Performance: Hit vs Miss by Score",
                color_discrete_sequence=px.colors.qualitative.Set3,
                hover_data={"Frequency": True, "Fairway Status": True, "Tee Club": True}
            )

            fig_par5.update_layout(
                yaxis=dict(title="Frequency"),
                xaxis=dict(title="Tee Club"),
                legend_title="Score",
                legend=dict(orientation="h", y=-0.2),
                barmode="group"
            )
            st.plotly_chart(fig_par5)
        else:
            st.write("No data available for par-5 analysis.")


        # Rolling Average Tee Accuracy Over Time
        st.subheader("Tee Shot Accuracy Over Time")
        st.write(
            "This line chart shows your rolling tee accuracy over time. "
            "Three lines are included: overall accuracy, par-4 accuracy, and par-5 accuracy, "
            "to help you track your performance and identify trends."
        )

        if not filtered_data.empty:
            # Group data by date and par type
            date_accuracy = (
                filtered_data.groupby(["Date", "Par"])["Fairway Hit (Numeric)"]
                .mean()
                .reset_index()
                .rename(columns={"Fairway Hit (Numeric)": "Accuracy (%)"})
            )
            date_accuracy["Rolling Accuracy"] = date_accuracy.groupby("Par")["Accuracy (%)"].rolling(5, min_periods=1).mean().reset_index(drop=True)

            # Overall accuracy
            overall_accuracy = (
                filtered_data.groupby("Date")["Fairway Hit (Numeric)"]
                .mean()
                .rolling(5, min_periods=1)
                .mean()
                .reset_index()
                .rename(columns={"Fairway Hit (Numeric)": "Rolling Accuracy"})
            )
            overall_accuracy["Par"] = "Overall"

            # Combine all data
            combined_accuracy = pd.concat([
                date_accuracy[date_accuracy["Par"].isin([4, 5])],
                overall_accuracy
            ])

            # Plot rolling accuracy over time
            fig_rolling_accuracy = px.line(
                combined_accuracy,
                x="Date",
                y="Rolling Accuracy",
                color="Par",
                labels={"Rolling Accuracy": "Accuracy (%)", "Date": "Date", "Par": "Par Type"},
                title="Tee Shot Accuracy Over Time"
            )
            st.plotly_chart(fig_rolling_accuracy)
        else:
            st.write("No data available for tee shot accuracy analysis.")


        # Greens in Regulation
        st.subheader("Greens in Regulation (GIR)")
        gir_percentage = (filtered_data["Green Status"] == "Hit").mean() * 100
        st.metric("Greens in Regulation (%)", f"{gir_percentage:.2f}%")

        # GIR Miss Patterns as a Heatmap
        gir_miss_data = filtered_data[filtered_data["Green Status"] != "Hit"]
        gir_miss_counts = gir_miss_data["Green Status"].value_counts()
        fig_gir_heatmap = px.density_heatmap(
            gir_miss_data,
            x="Green Status",
            y="Hole",
            z=None,
            nbinsx=len(gir_miss_counts),
            color_continuous_scale="Viridis",
            title="GIR Miss Patterns by Hole"
        )
        st.plotly_chart(fig_gir_heatmap)

        # Putting Performance
        st.subheader("Putting Performance")
        avg_putts = filtered_data["Putts"].mean()
        three_putt_percentage = (filtered_data["Putts"] >= 3).mean() * 100
        st.metric("Average Putts Per Hole", f"{avg_putts:.2f}")
        st.metric("Three-Putt Percentage", f"{three_putt_percentage:.2f}%")

        # Scoring Heatmap
        st.subheader("Scoring Trends")
        fig_scoring_heatmap = px.density_heatmap(
            filtered_data,
            x="Par",
            y="Handicap",
            z="Score",
            color_continuous_scale="Blues",
            title="Scoring Heatmap: Par and Handicap"
        )
        st.plotly_chart(fig_scoring_heatmap)

        # Club Performance Radial Chart
        st.subheader("Performance by Club")
        club_performance = filtered_data.groupby("Tee Club")["Fairway Hit"].apply(lambda x: (x == "Hit").mean() * 100)
        fig_club_radial = px.bar_polar(
            r=club_performance.values,
            theta=club_performance.index,
            color=club_performance.values,
            color_continuous_scale="Sunset",
            title="Tee Club Performance"
        )
        st.plotly_chart(fig_club_radial)

        # Approach Club Effectiveness
        st.subheader("Approach Club Effectiveness")
        approach_stats = filtered_data.groupby("Approach Club")["Distance to Green"].mean()
        fig_approach_club = px.bar(
            x=approach_stats.index,
            y=approach_stats.values,
            labels={"x": "Approach Club", "y": "Average Distance to Green (yards)"},
            title="Approach Club Accuracy",
            color=approach_stats.values,
            color_continuous_scale="Teal"
        )
        st.plotly_chart(fig_approach_club)

        # Hardest/Easiest Holes as a Scatter Plot
        st.subheader("Performance by Hole Handicap")
        scoring_by_handicap = filtered_data.groupby("Handicap")["Score"].mean().sort_index()
        fig_handicap_scatter = px.scatter(
            x=scoring_by_handicap.index,
            y=scoring_by_handicap.values,
            labels={"x": "Handicap", "y": "Average Score"},
            title="Average Score by Hole Handicap",
            color=scoring_by_handicap.values,
            color_continuous_scale="Magma"
        )
        st.plotly_chart(fig_handicap_scatter)