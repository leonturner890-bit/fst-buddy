# AI & Machine Learning Fundamentals

## AI, ML, and deep learning aren't synonyms
**Artificial Intelligence** is the broad goal of making machines perform
tasks that would require intelligence if a human did them. **Machine
Learning** is a subset of AI: systems that improve at a task by learning
patterns from data rather than following only explicitly hand-coded
rules. **Deep learning** is a subset of ML using multi-layered neural
networks specifically. Every deep learning system is ML, and every ML
system is AI, but plenty of AI (e.g. a rule-based expert system) involves
no learning from data at all.

## Supervised, unsupervised, and reinforcement learning
- **Supervised learning** — trains on labeled examples (input paired with
  the correct output), e.g. classification and regression.
- **Unsupervised learning** — finds structure in unlabeled data, e.g.
  clustering or dimensionality reduction.
- **Reinforcement learning** — an agent learns by taking actions in an
  environment and receiving reward/penalty signals, optimizing for
  cumulative reward over time rather than matching labeled examples.

## Overfitting and underfitting
A model **overfits** when it learns the noise/quirks of the training data
too closely and performs worse on new, unseen data — high training
accuracy, low test accuracy. It **underfits** when it's too simple to
capture the real pattern at all — poor accuracy on both training and test
data. This is usually framed as the bias-variance trade-off: an
underfit model has high bias, an overfit model has high variance.

## Neural networks, briefly
A neural network is layers of simple units ("neurons") that each compute
a weighted sum of their inputs and pass it through a non-linear
activation function. Training adjusts the weights via **backpropagation**
— computing how much each weight contributed to the error and nudging it
in the direction that reduces that error, typically using **gradient
descent**.

## Common misconceptions worth correcting
- "AI means the system is 'thinking' the way a person does." Most current
  AI, including large language models, is pattern recognition and
  statistical prediction learned from data — it doesn't imply
  understanding, consciousness, or reasoning in the human sense, even
  when the output reads as if it does.
- "More training data always makes a model better." More data helps up to
  a point, but low-quality, biased, or irrelevant data can make a model
  worse, and past a point the bottleneck shifts to model capacity or
  training technique rather than data volume.
- "A model with 99% accuracy is obviously good." On an imbalanced dataset
  (e.g. 99% of examples are the same class), a model that always predicts
  the majority class hits 99% accuracy while being useless — this is why
  precision, recall, and F1 exist alongside accuracy.
