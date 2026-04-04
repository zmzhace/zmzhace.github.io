---
title: "动手做预训练"
date: "2026-04-04"
description: "关于模型预训练的一些实验步骤"
---
实验总览
实验1: 数据解剖
实验2: 从零预训练
实验3: 制造训练崩溃
实验4: SFT 指令微调
实验5: LoRA 轻量微调
实验6: DPO 偏好对齐
实验7: 推理评估
实验 1：数据解剖 — "模型的食物长什么样？"
目标: 亲手把一段中文拆解成 Token，理解预训练数据的本质。

时间: ~15 分钟

具体步骤
1.1 Token 可视化
创建脚本 experiments/exp1_data_anatomy.py：

加载 MiniMind 的 Tokenizer
将一段中文文本编码为 Token ID
逐个打印每个 ID 对应的文字片段
观察点: 中文是按字分词还是按词分词？英文呢？数字呢？
1.2 预训练数据探索
从 pretrain_t2t_mini.jsonl 中随机抽取 5 条数据
统计 Token 长度分布
观察点: 数据的平均长度是多少？最长的有多长？
1.3 预训练 vs SFT 数据对比
分别从预训练数据和 SFT 数据中取一条
对比两者的结构差异
核心问题: 为什么 SFT 数据需要 conversations 格式？为什么预训练数据只需要 text 字段？
实验 2：从零预训练 — "见证智能的诞生"
目标: 用极小的数据量和极少的步数，完整走一遍预训练流程。在训练过程中，每隔一段时间让模型对同一个 Prompt 生成文本，亲眼观察模型从"胡言乱语"到"初步通顺"的过程。

时间: ~30 分钟

具体步骤
2.1 创建带"生成探针"的预训练脚本
修改 train_pretrain.py，加入以下逻辑：

每隔 200 个 step，暂停训练
对固定 Prompt（如 "天空是", "中国的首都", "1+1="）进行一次生成
打印生成结果，并记录当前 Loss
2.2 运行微缩预训练
bash
python trainer/train_pretrain.py \
  --epochs 1 \
  --batch_size 8 \
  --learning_rate 5e-4 \
  --max_seq_len 256 \
  --data_path ../dataset/pretrain_t2t_mini.jsonl \
  --from_weight none \
  --log_interval 50 \
  --save_interval 500
2.3 观察与记录
Step 0: 模型输出完全是乱码
Step 200: 开始出现真实的汉字
Step 500: 句子开始有一定的连贯性
Step 1000+: 模型开始展现出知识
IMPORTANT

这个实验的核心价值：你会亲眼看到 Loss 从 ~8.0 降到 ~3.0 的过程中，模型生成质量发生了质的飞跃。 这种体感是任何论文都无法给你的。

实验 3：制造训练崩溃 — "在可控环境中学会诊断"
目标: 故意制造我们之前讨论的那些"病例"，观察 Loss 曲线和模型行为的异常表现，并学会诊断。

时间: ~30 分钟

病例 A：学习率爆炸
将学习率设为 10.0（正常值为 5e-4）
预期现象: Loss 在几个 step 内飙升到 NaN
诊断练习: 观察 Gradient Norm 在崩溃前的异常飙升
病例 B：梯度累积不当
将 accumulation_steps 设为 64，但不相应调整学习率
预期现象: 训练极慢，Loss 下降非常缓慢
诊断练习: 理解"等效 Batch Size"的概念
病例 C：序列截断过短
将 max_seq_len 设为 32（正常值为 340）
预期现象: Loss 下降得很快，但模型实际生成能力极差（只能说几个字就停了）
诊断练习: 理解"上下文窗口"对模型能力的影响
病例 D：监控梯度健康
在训练循环中加入以下监控代码：

python
# 在每个 step 后打印梯度统计
grad_norm = torch.nn.utils.clip_grad_norm_(model.parameters(), float('inf'))
print(f"Step {step}: Loss={loss:.4f}, Grad_Norm={grad_norm:.4f}")
WARNING

这些实验会产生无用的权重文件。建议将 save_dir 设为一个临时目录（如 ../out_experiments），实验结束后清理。

实验 4：SFT 指令微调 — "从会说话到会听话"
目标: 在预训练好的模型基础上，进行指令微调，让模型学会遵循人类指令。深入理解 Loss Masking 机制。

时间: ~30 分钟

具体步骤
4.1 理解 Loss Masking
打开 dataset/lm_dataset.py 中 SFTDataset.generate_labels 方法
打开注释掉的调试代码（第 114-118 行），运行后观察：
用户说的话 -> label = -100（不计算 Loss）
助手说的话 -> label = 真实Token（计算 Loss）
核心理解: 这就是让模型只学"怎么回答"而不学"怎么提问"的秘密
4.2 运行 SFT 微调
bash
python trainer/train_full_sft.py \
  --epochs 1 \
  --batch_size 8 \
  --learning_rate 1e-5 \
  --max_seq_len 512 \
  --data_path ../dataset/sft_t2t_mini.jsonl \
  --from_weight pretrain \
  --log_interval 50
4.3 对比实验
用同一组测试问题，分别让预训练模型和SFT 模型回答
观察: 预训练模型只会"续写"，SFT 模型会"回答"
实验 5：LoRA 轻量微调 — "只改 1% 的参数"
目标: 理解 LoRA 的低秩分解原理。为什么只训练极少的参数，就能让模型学会新技能？

时间: ~20 分钟

具体步骤
5.1 分析 LoRA 代码
阅读 
model_lora.py
核心公式: output = W·x + B·A·x
W 是原始的大矩阵（冻结不动）
A 和 B 是两个很小的矩阵（只训练它们）
rank=16 意味着中间维度只有 16
5.2 参数量对比实验
打印完整模型的可训练参数量
应用 LoRA 后，再打印可训练参数量
观察: 可训练参数从数百万降到数万
5.3 用医疗数据微调
使用 dataset/lora_medical.jsonl 进行 LoRA 微调
对比微调前后，模型在医疗问题上的回答质量
实验 6：DPO 偏好对齐 — "教模型分辨好坏"
目标: 理解 DPO（Direct Preference Optimization）如何通过对比"好回答"和"坏回答"来提升模型质量。

时间: ~20 分钟

具体步骤
6.1 分析 DPO 数据格式
查看 dataset/dpo.jsonl 的数据结构
每条数据包含：chosen（好回答）和 rejected（坏回答）
思考: 模型是如何通过对比学习来提高的？
6.2 理解 DPO Loss
阅读 trainer/train_dpo.py 中的损失函数
核心直觉: DPO 的目标是让模型给"好回答"更高的概率，给"坏回答"更低的概率
6.3 运行 DPO 训练
基于 SFT 模型，运行一轮 DPO
对比 SFT 模型和 DPO 模型的回答风格差异
实验 7：推理评估 — "检验成果"
目标: 使用 eval_llm.py 对各个阶段的模型进行统一测试和对比。

时间: ~15 分钟

具体步骤
7.1 加载已下载的 minimind-3 模型
bash
python eval_llm.py --load_from minimind-3
7.2 对比不同阶段的模型
模型	预期表现
从零预训练 (Step 500)	能说通顺句子，但答非所问
从零预训练 (Step 2000)	有一定知识储备
SFT 微调后	能正确回答指令
LoRA 微调后	在特定领域（医疗）表现更好
DPO 对齐后	回答更流畅、更安全
实验执行顺序
顺序	实验	预计时间	核心收获
1	数据解剖	15 min	理解 Token 化和数据格式
2	从零预训练	30 min	见证"智能涌现"
3	制造崩溃	30 min	培养诊断直觉
4	SFT 微调	30 min	理解 Loss Masking
5	LoRA 微调	20 min	理解参数高效微调
6	DPO 对齐	20 min	理解偏好学习
7	推理评估	15 min	横向对比各阶段效果
NOTE

总计约 2.5 小时，可以分多天完成。建议每天集中做 1-2 个实验，留时间消化。

User Review Required
IMPORTANT

请确认以下几点：

您的机器是否有 NVIDIA GPU（CUDA）？如果没有，实验 2-6 的训练脚本需要调整为 CPU 模式，训练时间会显著变长。
您希望从哪个实验开始？建议按顺序，但如果您对某个实验特别感兴趣，也可以跳着做。
每个实验中，我会为您创建独立的实验脚本（放在 experiments/ 目录下），不会修改原始代码。您同意这种方式吗？
Open Questions
IMPORTANT

您是否希望我在每个实验结束后生成一份"实验报告"（Markdown），记录您的观察结果？
对于实验 3（制造崩溃），您是否有其他想模拟的"病例"？
---
