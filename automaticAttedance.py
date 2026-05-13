import tkinter as tk
from tkinter import *
import os, cv2
import csv
import numpy as np
import pandas as pd
import datetime
import time

haarcasecade_path = "haarcascade_frontalface_default.xml"
trainimagelabel_path = "./TrainingImageLabel/Trainner.yml"
studentdetail_path = "./StudentDetails/studentdetails.csv"
attendance_path = "Attendance"


def subjectChoose(text_to_speech):

    def FillAttendance():

        sub = tx.get().strip()
        sub = sub.replace("/", "_").replace("\\", "_")

        if sub == "":
            text_to_speech("Please enter the subject name!!!")
            return

        try:
            recognizer = cv2.face.LBPHFaceRecognizer_create()
            recognizer.read(trainimagelabel_path)

            face_cascade = cv2.CascadeClassifier(haarcasecade_path)
            df = pd.read_csv(studentdetail_path)

            cam = cv2.VideoCapture(0)
            font = cv2.FONT_HERSHEY_SIMPLEX

            col_names = ["Enrollment", "Name"]
            attendance = pd.DataFrame(columns=col_names)

            # 🔥 COUNT SYSTEM
            id_counts = {}

            # ⏳ TIME LIMIT (25 sec)
            start_time = time.time()
            future = start_time + 25

            while True:

                ret, im = cam.read()
                if not ret:
                    continue

                gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.2, 5)

                for (x, y, w, h) in faces:

                    if w < 100 or h < 100:
                        continue

                    Id, conf = recognizer.predict(gray[y:y+h, x:x+w])

                    # ✅ CORRECTLY INDENTED BLOCK
                    if conf < 50:

                        if Id in id_counts:
                            id_counts[Id] += 1
                        else:
                            id_counts[Id] = 1

                        try:
                            aa = df.loc[df["Enrollment"] == Id]["Name"].values[0]

                            cv2.rectangle(im, (x, y), (x+w, y+h), (0, 255, 0), 3)
                            cv2.putText(im, f"{aa} ({id_counts[Id]})",
                                        (x, y-10), font, 0.8, (255, 255, 0), 2)
                        except:
                            pass

                    else:
                        cv2.rectangle(im, (x, y), (x+w, y+h), (0, 0, 255), 3)
                        cv2.putText(im, "Unknown", (x, y-10),
                                    font, 0.8, (0, 0, 255), 2)

                cv2.imshow("Filling Attendance...", im)

                if cv2.waitKey(30) & 0xFF == 27:
                    break

                if time.time() > future:
                    break

            # 🔥 FINAL DECISION (MOST FREQUENT ID)
            if len(id_counts) > 0:

                final_id = max(id_counts, key=id_counts.get)

                try:
                    final_name = df.loc[df["Enrollment"] == final_id]["Name"].values[0]
                    attendance.loc[len(attendance)] = [final_id, final_name]
                except:
                    pass

            # SAVE
            ts = time.time()
            date = datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            timeStamp = datetime.datetime.fromtimestamp(ts).strftime("%H-%M-%S")

            attendance[date] = 1

            path = os.path.join(attendance_path, sub)
            os.makedirs(path, exist_ok=True)

            fileName = os.path.join(path, f"{sub}_{date}_{timeStamp}.csv")
            attendance.to_csv(fileName, index=False)

            msg = "Attendance Filled Successfully for " + sub
            Notifica.configure(text=msg)
            text_to_speech(msg)

            cam.release()
            cv2.destroyAllWindows()

        except Exception as e:
            text_to_speech("Error in attendance system")
            print(e)
            cv2.destroyAllWindows()


    def Attf():
        sub = tx.get().strip()
        sub = sub.replace("/", "_").replace("\\", "_")

        if sub == "":
            text_to_speech("Please enter subject name!!!")
        else:
            os.startfile(f"Attendance\\{sub}")


    # ================= UI =================

    subject = Tk()
    subject.title("Subject Selection")
    subject.geometry("600x350")
    subject.configure(bg="#121212")

    header = Frame(subject, bg="#0f3460", height=70)
    header.pack(fill=X)

    Label(header, text="Select Subject for Attendance",
          bg="#0f3460", fg="white",
          font=("Helvetica", 20, "bold")).pack(pady=15)

    main_frame = Frame(subject, bg="#121212")
    main_frame.pack(pady=40)

    Label(main_frame, text="Subject Name",
          font=("Helvetica", 14, "bold"),
          bg="#121212", fg="white").grid(row=0, column=0)

    tx = Entry(main_frame, width=20,
               font=("Helvetica", 16),
               bg="#1f1f1f", fg="white",
               insertbackground="white")
    tx.grid(row=0, column=1, padx=10)

    button_frame = Frame(subject, bg="#121212")
    button_frame.pack(pady=30)

    Button(button_frame, text="Fill Attendance",
           command=FillAttendance,
           bg="#16213e", fg="white",
           font=("Helvetica", 12, "bold"),
           width=15).grid(row=0, column=0, padx=20)

    Button(button_frame, text="Check Sheets",
           command=Attf,
           bg="#e94560", fg="white",
           font=("Helvetica", 12, "bold"),
           width=15).grid(row=0, column=1, padx=20)

    Notifica = Label(subject, text="",
                     bg="#121212", fg="yellow",
                     font=("Helvetica", 12, "bold"))
    Notifica.pack()

    subject.mainloop()