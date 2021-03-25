# -*- coding: utf-8 -*-
"""
Created on Mon Nov 23 16:50:01 2020


"""
import pickle
import pandas as pd
import numpy as np
from sklearn import metrics
from sklearn import svm
from sklearn import model_selection
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline



""" Pre-processing:
The purpose of this function is to read in the traing & test data sets, clean them and
provide them with binary classification labels. In this case, the classification label provides
an indication as to whether, at the time of the reading, the engine will fail within 30 cycles.
It is deduced from calculating the remaining cycles to engine failure. 
"""
def preprocess():
    
  # The column names for test and training data. There are 26 features (excluding Nan1 and NaN2, see comment below).
  columns = ["id","cycle","op1","op2","op3","sensor1","sensor2","sensor3","sensor4","sensor5","sensor6","sensor7","sensor8",
  "sensor9","sensor10","sensor11","sensor12","sensor13","sensor14","sensor15","sensor16","sensor17","sensor18","sensor19",
  "sensor20","sensor21", "NaN1", "NaN2"]

  """ 
  NaN1 & NaN2 are temporarily required for reading in the sets because invisible 
  characters seem to be influencing the shape of the resulting dataframes. 
  i.e. there should be only 26 columns but the dataframes have 28. 
  These two columns are dropped immediately after reading in the sets.
  """
    # Reading in the test, train and test_RUL datasets.
  train =    pd.read_csv("train_FD001.txt", sep = " ", names = columns).drop(["NaN1","NaN2"], axis = 1)
  test =     pd.read_csv("test_FD001.txt",  sep = " ", names = columns).drop(["NaN1","NaN2"], axis = 1)
  test_RUL = pd.read_csv("RUL_FD001.txt",   sep = " ", header = None)
  
  # A 'remaining_cycles' column is firstly added to both the test and training datasets.
  # Binary labels are then created for them based on 'remaining_cycles' (0 if more than 30 cycles left, else 1).
 
  # Getting the failing cycle for each engine in the test set.
  # (i.e. last recorded cycle of engine + RUL of engine).
  test_RUL.columns = ["rul","null"]
  test_RUL.drop(["null"], axis = 1 , inplace = True)
  test_RUL['id'] = test_RUL.index+1
  temp = pd.DataFrame(test.groupby('id')['cycle'].max()).reset_index()
  temp.columns = ['id', 'last_cycle']
  test_RUL['failing_cycle'] = test_RUL['rul'] + temp['last_cycle']
  test_RUL.drop(["rul"], axis = 1 , inplace = True)
  test = test.merge(test_RUL, on = ['id'], how = 'left')
  
  # Populating 'remaining_cycles' values for the test set.
  test["remaining_cycles"] = test["failing_cycle"] - test["cycle"]

  # Caluculating & populating 'remaining_cycles' values for the training set.
  train['remaining_cycles'] = train.groupby(['id'])['cycle'].transform(max)-train['cycle']
 
  # Creating the binary labels for the training and test data based on 'remaining_cycles' (1 if it less than 30 cycles, else 0).
  n_cycles = 30
  train['label'] = train['remaining_cycles'].apply(lambda x: 1 if x <= n_cycles else 0)
  test['label'] =   test['remaining_cycles'].apply(lambda x: 1 if x <= n_cycles else 0)
  
  # Now that we have the labels, we can discard 'remaining_cycles' and 'failing_cycle' along with several other unneeded columns.
  test.drop(["id","cycle","remaining_cycles","op3","sensor1","sensor5","sensor6","sensor10","sensor16","sensor18","sensor19","failing_cycle"], axis=1,inplace=True)
  train.drop(["id","cycle","remaining_cycles","op3","sensor1","sensor5","sensor6","sensor10","sensor16","sensor18","sensor19"], axis=1,inplace=True)
  
  
  # Slice the training data into feature vectors and labels.
  train_data =   np.array(train.drop(["label"], axis=1))
  train_labels = np.array(train.label)

  # Slice the test data into feature vectors and labels.
  test_data =   np.array(test.drop(["label"], axis=1))
  test_labels = np.array(test.label)
  
  return train_data, train_labels, test_data, test_labels




def crossVal(classifier, nSplits):
    data, labels, _, _ = preprocess()
    kf = model_selection.KFold(n_splits=nSplits)
    scores = []   # A list to store K-fold acuracy scores.
    index = 0  
    for train, test in kf.split(data, labels):
         X = classifier.fit(data[train], labels[train]) 
         predictions = X.predict(data[test])
         score = metrics.accuracy_score(labels[test], predictions)
         scores.append(score)
         cMatrix = metrics.confusion_matrix(labels[test], predictions)
          # Printing the split results to console.
         print("\n================================================")
         print("K-fold iteration " +  str(index+1) )
         print("Accuracy score: " + str(score))
         print("Confusion Matrix:")
         print(cMatrix)
         print("================================================")
         index +=1

    # Getting the mean accuracy score of the splits.
    _sum = 0
    for val in scores:
        _sum += val
    meanAccuracy = float(_sum)/index
    print("\nMean k-fold accuracy score: ", str(meanAccuracy))  




def main():
    
     train_data, train_labels, test_data, test_labels = preprocess()
     clf = make_pipeline(StandardScaler(), svm.SVC(gamma='auto'))  
     model = clf.fit(train_data, train_labels) 
     pickle.dump(model, open("NasaTurbfan.sav", 'wb'))
     #model = pickle.load(open("NasaTurbofan.sav",'rb'))
    
     predictions = model.predict(test_data)
     score = metrics.accuracy_score(test_labels, predictions)
     cMatrix = metrics.confusion_matrix(test_labels, predictions)
     print("Accuracy score: " + str(score))
     print("Confusion Matrix:")
     print(cMatrix)
     
     
main()


